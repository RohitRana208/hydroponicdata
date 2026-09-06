// ============================================================================
// NutriFlow ESP32-S3 CAM — Multi-Board Auto-Detecting Camera & Sensor Firmware
// ============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "esp_camera.h"
#include "mbedtls/base64.h"

// ─── Pin Configuration for TDS & UART ───────────────────────────────────────
// Note: We use GPIO 1 for TDS so it never conflicts with Camera I2C lines (SIOD/SIOC)
#define TDS_PIN 1   // Analog ADC1_CH0 (Safe on all S3 boards)
#define TX_PIN  17  // ESP32 TX -> Arduino A1 (RX)
#define RX_PIN  18  // ESP32 RX -> Arduino A2 (TX)

// ─── WiFi & Cloud Endpoints ─────────────────────────────────────────────────
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

// ─── Camera Pinout Profiles ─────────────────────────────────────────────────

// Profile 1: Freenove ESP32-S3 CAM / Waveshare / Generic Dual-USB S3 CAM
camera_config_t getProfileFreenoveS3() {
  camera_config_t c;
  c.ledc_channel = LEDC_CHANNEL_0;
  c.ledc_timer   = LEDC_TIMER_0;
  c.pin_d0       = 11;
  c.pin_d1       = 9;
  c.pin_d2       = 8;
  c.pin_d3       = 10;
  c.pin_d4       = 12;
  c.pin_d5       = 18;
  c.pin_d6       = 17;
  c.pin_d7       = 16;
  c.pin_xclk     = 15;
  c.pin_pclk     = 13;
  c.pin_vsync    = 6;
  c.pin_href     = 7;
  c.pin_sccb_sda = 4;
  c.pin_sccb_scl = 5;
  c.pin_pwdn     = -1;
  c.pin_reset    = -1;
  c.xclk_freq_hz = 20000000;
  c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size   = psramFound() ? FRAMESIZE_SVGA : FRAMESIZE_VGA;
  c.jpeg_quality = psramFound() ? 12 : 15;
  c.fb_count     = psramFound() ? 2 : 1;
  c.fb_location  = psramFound() ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;
  c.grab_mode    = CAMERA_GRAB_LATEST;
  return c;
}

// Profile 2: AI-Thinker ESP32-S3 CAM / Generic S3 N8R8
camera_config_t getProfileAIThinkerS3() {
  camera_config_t c;
  c.ledc_channel = LEDC_CHANNEL_0;
  c.ledc_timer   = LEDC_TIMER_0;
  c.pin_d0       = 15;
  c.pin_d1       = 7;
  c.pin_d2       = 5;
  c.pin_d3       = 4;
  c.pin_d4       = 6;
  c.pin_d5       = 8;
  c.pin_d6       = 9;
  c.pin_d7       = 11;
  c.pin_xclk     = 10;
  c.pin_pclk     = 16;
  c.pin_vsync    = 13;
  c.pin_href     = 12;
  c.pin_sccb_sda = 21;
  c.pin_sccb_scl = 14;
  c.pin_pwdn     = -1;
  c.pin_reset    = -1;
  c.xclk_freq_hz = 20000000;
  c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size   = psramFound() ? FRAMESIZE_SVGA : FRAMESIZE_VGA;
  c.jpeg_quality = psramFound() ? 12 : 15;
  c.fb_count     = psramFound() ? 2 : 1;
  c.fb_location  = psramFound() ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;
  c.grab_mode    = CAMERA_GRAB_LATEST;
  return c;
}

// Profile 3: Seeed Studio XIAO ESP32S3 Sense
camera_config_t getProfileXiaoS3() {
  camera_config_t c;
  c.ledc_channel = LEDC_CHANNEL_0;
  c.ledc_timer   = LEDC_TIMER_0;
  c.pin_d0       = 15;
  c.pin_d1       = 17;
  c.pin_d2       = 18;
  c.pin_d3       = 16;
  c.pin_d4       = 14;
  c.pin_d5       = 12;
  c.pin_d6       = 11;
  c.pin_d7       = 48;
  c.pin_xclk     = 10;
  c.pin_pclk     = 13;
  c.pin_vsync    = 38;
  c.pin_href     = 47;
  c.pin_sccb_sda = 40;
  c.pin_sccb_scl = 39;
  c.pin_pwdn     = -1;
  c.pin_reset    = -1;
  c.xclk_freq_hz = 20000000;
  c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size   = psramFound() ? FRAMESIZE_SVGA : FRAMESIZE_VGA;
  c.jpeg_quality = psramFound() ? 12 : 15;
  c.fb_count     = psramFound() ? 2 : 1;
  c.fb_location  = psramFound() ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;
  c.grab_mode    = CAMERA_GRAB_LATEST;
  return c;
}

// ─── Smart Auto-Probing Camera Initialization ───────────────────────────────
bool initCameraAuto() {
  Serial.println("\n[CAM] Probing Camera Hardware...");
  if (psramFound()) {
    Serial.printf("[CAM] PSRAM Detected: %d KB free\n", ESP.getFreePsram() / 1024);
  } else {
    Serial.println("[CAM] ℹ️ Running without PSRAM (DRAM buffer)");
  }

  // 1. Try Freenove S3 Pinout (Most Common S3-WROOM CAM)
  Serial.println("[CAM] Testing Profile 1 (Freenove / Generic S3 CAM)...");
  camera_config_t config1 = getProfileFreenoveS3();
  esp_err_t err = esp_camera_init(&config1);
  if (err == ESP_OK) {
    Serial.println("✅ [CAM] Profile 1 Matched: Camera Initialized (Freenove S3 Pinout)!");
    return true;
  }
  Serial.printf("   Profile 1 failed (0x%x). De-initializing...\n", err);
  esp_camera_deinit();
  delay(100);

  // 2. Try AI-Thinker S3 Pinout
  Serial.println("[CAM] Testing Profile 2 (AI-Thinker S3 Pinout)...");
  camera_config_t config2 = getProfileAIThinkerS3();
  err = esp_camera_init(&config2);
  if (err == ESP_OK) {
    Serial.println("✅ [CAM] Profile 2 Matched: Camera Initialized (AI-Thinker S3 Pinout)!");
    return true;
  }
  Serial.printf("   Profile 2 failed (0x%x). De-initializing...\n", err);
  esp_camera_deinit();
  delay(100);

  // 3. Try Xiao S3 Pinout
  Serial.println("[CAM] Testing Profile 3 (Xiao S3 Sense Pinout)...");
  camera_config_t config3 = getProfileXiaoS3();
  err = esp_camera_init(&config3);
  if (err == ESP_OK) {
    Serial.println("✅ [CAM] Profile 3 Matched: Camera Initialized (Xiao S3 Sense)!");
    return true;
  }
  esp_camera_deinit();

  Serial.println("❌ [CAM] All S3 Camera profiles failed.");
  Serial.println("   -> Checklist: 1. Ensure camera ribbon cable is firmly inserted in connector.");
  Serial.println("   -> 2. In Arduino IDE: Tools -> PSRAM -> 'OPI PSRAM'");
  return false;
}

// ─── Capture & Upload Plant Snapshot to MongoDB ─────────────────────────────
bool captureAndUploadPhoto(const char* triggerType) {
  if (!cameraReady) {
    Serial.println("❌ [CAM] Cannot capture: Camera probe was not successful on boot");
    return false;
  }
  if (WiFi.status() != WL_CONNECTED) return false;

  Serial.printf("📸 [CAM] Capturing Photo (%s)...\n", triggerType);
  
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ [CAM] Frame buffer acquisition failed");
    return false;
  }

  Serial.printf("📸 [CAM] Photo Captured: %d bytes (JPEG). Encoding Base64...\n", fb->len);

  size_t output_len = 0;
  mbedtls_base64_encode(NULL, 0, &output_len, fb->buf, fb->len);
  
  unsigned char * b64_buffer = (unsigned char *)malloc(output_len + 1);
  if (!b64_buffer) {
    Serial.println("❌ [CAM] Out of memory allocating Base64 buffer");
    esp_camera_fb_return(fb);
    return false;
  }

  mbedtls_base64_encode(b64_buffer, output_len, &output_len, fb->buf, fb->len);
  b64_buffer[output_len] = '\0';
  esp_camera_fb_return(fb);

  String jsonBody = "{\"trigger\":\"" + String(triggerType) + "\",\"image\":\"data:image/jpeg;base64," + String((char*)b64_buffer) + "\"}";
  free(b64_buffer);

  Serial.println("📡 [CAM] Uploading to MongoDB Atlas via Vercel...");

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, serverCamUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(20000);

  int httpCode = http.POST(jsonBody);
  if (httpCode == 200 || httpCode == 201) {
    Serial.printf("✅ [CAM] Plant Photo uploaded to MongoDB Atlas successfully! (HTTP %d)\n", httpCode);
    http.end();
    return true;
  } else {
    Serial.printf("❌ [CAM] Upload Failed with HTTP Code: %d\n", httpCode);
    http.end();
    return false;
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  UnoSerial.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);
  pinMode(TDS_PIN, INPUT_PULLDOWN);

  Serial.println("\n==========================================");
  Serial.println("  NutriFlow ESP32-S3 CAM Node Booting...  ");
  Serial.println("==========================================");

  // 1. Initialize Camera with Auto-Pinout Matcher
  cameraReady = initCameraAuto();

  // 2. Connect to WiFi
  Serial.printf("Connecting to WiFi '%s' ", ssid);
  WiFi.begin(ssid, password);
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 30) {
    delay(400);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected! IP: " + WiFi.localIP().toString());
    if (cameraReady) {
      delay(1500);
      captureAndUploadPhoto("boot_init");
      lastPhotoUpload = millis();
    }
  } else {
    Serial.println("\n❌ WiFi Connection Timeout.");
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

  // 2. Read Local TDS Hardware (10-sample Averaging on 3.3V)
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
