// ============================================================================
// NutriFlow ESP32-S3 CAM — Cloud Gateway, TDS Sensor & Plant Vision Firmware
// ============================================================================
// Features:
// 1. Live TDS Sensor sampling on GPIO 4 (3.3V calibrated baseline).
// 2. Bidirectional UART with Arduino Uno Master (9600 baud, TX=17, RX=18).
// 3. Periodic Sensor JSON sync to Cloud every 5 seconds.
// 4. Automated High-Resolution Plant Snapshot every 30 minutes to MongoDB Atlas.
// 5. On-Demand Instant "Capture Now" Trigger handling from Dashboard.
// ============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "esp_camera.h"
#include "mbedtls/base64.h"

// ─── Pin Configuration ───────────────────────────────────────────────────────
#define TDS_PIN 4
#define TX_PIN 17  // ESP32 TX -> Arduino A1 (RX)
#define RX_PIN 18  // ESP32 RX -> Arduino A2 (TX)

// ─── Standard ESP32-S3 CAM (OV2640) Pin Mapping ──────────────────────────────
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     10
#define SIOD_GPIO_NUM     21
#define SIOC_GPIO_NUM     14

#define Y9_GPIO_NUM       11
#define Y8_GPIO_NUM       9
#define Y7_GPIO_NUM       8
#define Y6_GPIO_NUM       6
#define Y5_GPIO_NUM       4
#define Y4_GPIO_NUM       5
#define Y3_GPIO_NUM       7
#define Y2_GPIO_NUM       15
#define VSYNC_GPIO_NUM    13
#define HREF_GPIO_NUM     12
#define PCLK_GPIO_NUM     16

// ─── WiFi & Cloud Settings ──────────────────────────────────────────────────
const char* ssid          = "moto";
const char* password      = "11223344";
const char* serverDataUrl = "https://hydroponicdata.vercel.app/api/sensors/data";
const char* serverCamUrl  = "https://hydroponicdata.vercel.app/api/camera/upload";

const float AIR_VOLTAGE_BASELINE = 2.23;

HardwareSerial UnoSerial(1);

// Master Data synchronized from Arduino Uno
float sys_ph  = 7.0;
float sys_wl  = 15.0;
float sys_wt  = 25.0;
float sys_rt  = 28.0;
float sys_hum = 60.0;
float sys_tds = 0.0;
float sys_ec  = 0.0;

float localTDS = 0.0;
bool cameraReady = false;

unsigned long lastCloudPush   = 0;
unsigned long lastUartPush    = 0;
unsigned long lastPhotoUpload = 0;
const unsigned long PHOTO_INTERVAL_MS = 30UL * 60UL * 1000UL; // 30 Minutes

// ─── Initialize OV2640 Camera ───────────────────────────────────────────────
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // High Quality SVGA (800x600) for sharp plant leaf inspection
  if (psramFound()) {
    config.frame_size   = FRAMESIZE_SVGA; // 800x600
    config.jpeg_quality = 12;             // 10-63 (lower is higher quality)
    config.fb_count     = 2;
    config.fb_location  = CAMERA_FB_IN_PSRAM;
  } else {
    config.frame_size   = FRAMESIZE_VGA;  // 640x480
    config.jpeg_quality = 14;
    config.fb_count     = 1;
    config.fb_location  = CAMERA_FB_IN_DRAM;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Camera Init Failed: 0x%x\n", err);
    return false;
  }

  sensor_t * s = esp_camera_sensor_get();
  if (s != NULL) {
    s->set_brightness(s, 1);   // -2 to 2
    s->set_contrast(s, 1);     // -2 to 2
    s->set_saturation(s, 1);   // -2 to 2
  }

  Serial.println("✅ OV2640 Camera Initialized Successfully!");
  return true;
}

// ─── Capture & Upload Plant Snapshot to MongoDB ─────────────────────────────
bool captureAndUploadPhoto(const char* triggerType) {
  if (!cameraReady) return false;
  if (WiFi.status() != WL_CONNECTED) return false;

  Serial.printf("📸 Capturing Plant Photo (%s)...\n", triggerType);
  
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ Camera capture failed");
    return false;
  }

  // Convert binary JPEG buffer to Base64 String
  size_t output_len = 0;
  mbedtls_base64_encode(NULL, 0, &output_len, fb->buf, fb->len);
  
  unsigned char * b64_buffer = (unsigned char *)malloc(output_len + 1);
  if (!b64_buffer) {
    Serial.println("❌ Memory allocation failed for Base64");
    esp_camera_fb_return(fb);
    return false;
  }

  mbedtls_base64_encode(b64_buffer, output_len, &output_len, fb->buf, fb->len);
  b64_buffer[output_len] = '\0';
  esp_camera_fb_return(fb); // Release frame buffer immediately

  // Construct JSON Payload
  String jsonBody = "{\"trigger\":\"" + String(triggerType) + "\",\"image\":\"data:image/jpeg;base64," + String((char*)b64_buffer) + "\"}";
  free(b64_buffer);

  // Send POST Request to Vercel Serverless Upload API
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, serverCamUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(15000);

  int httpCode = http.POST(jsonBody);
  if (httpCode == 200 || httpCode == 201) {
    Serial.printf("✅ [CAM] Plant Photo uploaded to MongoDB Atlas! (HTTP %d)\n", httpCode);
    http.end();
    return true;
  } else {
    Serial.printf("❌ [CAM] Photo Upload Failed: %d\n", httpCode);
    http.end();
    return false;
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  UnoSerial.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);
  pinMode(TDS_PIN, INPUT_PULLDOWN);

  // Initialize Camera
  cameraReady = initCamera();

  // Connect to WiFi
  Serial.printf("Connecting to WiFi '%s' ", ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected! IP: " + WiFi.localIP().toString());

  // Take initial boot snapshot
  if (cameraReady) {
    delay(2000);
    captureAndUploadPhoto("boot_init");
    lastPhotoUpload = millis();
  }
}

// ─── Loop ───────────────────────────────────────────────────────────────────
void loop() {
  // 1. Read CSV Data from Arduino Uno Master
  if (UnoSerial.available()) {
    String incoming = UnoSerial.readStringUntil('\n');
    incoming.trim();
    if (incoming.startsWith("D:")) {
      String dataStr = incoming.substring(2);
      int i1 = dataStr.indexOf(',');
      int i2 = dataStr.indexOf(',', i1 + 1);
      int i3 = dataStr.indexOf(',', i2 + 1);
      int i4 = dataStr.indexOf(',', i3 + 1);
      int i5 = dataStr.indexOf(',', i4 + 1);
      int i6 = dataStr.indexOf(',', i5 + 1);

      if (i6 > 0) {
        sys_ph  = dataStr.substring(0, i1).toFloat();
        sys_wl  = dataStr.substring(i1 + 1, i2).toFloat();
        sys_wt  = dataStr.substring(i2 + 1, i3).toFloat();
        sys_rt  = dataStr.substring(i3 + 1, i4).toFloat();
        sys_hum = dataStr.substring(i4 + 1, i5).toFloat();
        sys_tds = dataStr.substring(i5 + 1, i6).toFloat();
        sys_ec  = dataStr.substring(i6 + 1).toFloat();

        Serial.printf("[SYNC] pH:%.1f WL:%.1f WT:%.1f RT:%.1f Hum:%.1f TDS:%.0f EC:%.2f\n",
                      sys_ph, sys_wl, sys_wt, sys_rt, sys_hum, sys_tds, sys_ec);
      }
    }
  }

  // 2. Read Local TDS Hardware (Accurate 10-sample Averaging)
  long rawSum = 0;
  for (int i = 0; i < 10; i++) {
    rawSum += analogRead(TDS_PIN);
    delay(2);
  }
  float rawVoltage = (rawSum / 10.0) * (3.3 / 4095.0);
  float actualVoltage = max(0.0f, (float)(rawVoltage - AIR_VOLTAGE_BASELINE));

  localTDS = 0;
  if (actualVoltage > 0.1) {
    localTDS = (133.42 * pow(actualVoltage, 3) - 255.86 * pow(actualVoltage, 2) + 857.39 * actualVoltage) * 0.5;
  }

  // 3. Send Local TDS to Arduino Uno (Every 1 Sec)
  if (millis() - lastUartPush > 1000) {
    UnoSerial.print("TDS:");
    UnoSerial.println(localTDS, 0);
    lastUartPush = millis();
  }

  // 4. Send Unified Sensor Data to Cloud (Every 5 Sec)
  if (millis() - lastCloudPush > 5000) {
    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setInsecure();
      HTTPClient http;
      http.begin(client, serverDataUrl);
      http.addHeader("Content-Type", "application/json");

      StaticJsonDocument<256> doc;
      doc["tds"]        = round(sys_tds > 0 ? sys_tds : localTDS);
      doc["ec"]         = sys_ec > 0 ? sys_ec : (localTDS / 500.0);
      doc["ph"]         = sys_ph;
      doc["waterLevel"] = sys_wl;
      doc["waterTemp"]  = sys_wt;
      doc["airTemp"]    = sys_rt;
      doc["humidity"]   = sys_hum;

      String jsonPayload;
      serializeJson(doc, jsonPayload);
      int code = http.POST(jsonPayload);

      if (code > 0) {
        String resp = http.getString();
        StaticJsonDocument<256> respDoc;
        deserializeJson(respDoc, resp);

        // Check if Dashboard requested instant "Capture Now" photo
        bool captureRequested = respDoc["captureRequested"] | false;
        if (captureRequested) {
          Serial.println("⚡ On-Demand Live Photo requested from Dashboard!");
          captureAndUploadPhoto("manual_request");
          lastPhotoUpload = millis();
        }
      }
      http.end();
    }
    lastCloudPush = millis();
  }

  // 5. Automated 30-Minute Plant Snapshot Timer
  if (millis() - lastPhotoUpload >= PHOTO_INTERVAL_MS) {
    captureAndUploadPhoto("auto_30min");
    lastPhotoUpload = millis();
  }
}
