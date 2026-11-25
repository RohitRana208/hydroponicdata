// ============================================================================
// NutriFlow ESP32-S3-N16R8 CAM — Gateway + TDS + Plant Vision
// ============================================================================
//
//  PIN CONNECTIONS:
//
//  TDS Sensor:
//    Signal (Yellow) ---> G2   (GPIO 2, ADC1_CH1)
//    VCC    (Red)    ---> 3V3  (MUST be 3.3V, NOT 5V!)
//    GND    (Black)  ---> GND
//
//  Arduino Uno UART:
//    Arduino A2 (TX) ---> RX0  (GPIO 44) on ESP32
//    Arduino A1 (RX) ---> TX0  (GPIO 43) on ESP32
//    Arduino GND     ---> GND  on ESP32  (Shared GND zaroori hai!)
//
//  Camera OV2640:
//    Already connected via internal ribbon cable on this board.
//
// ============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "esp_camera.h"
#include "mbedtls/base64.h"

// --- Pin Definitions --------------------------------------------------------
#define TDS_PIN   2   // G2 --- GPIO 2, ADC1_CH1 (3.3V signal only!)
#define TX_PIN   43   // TX0 --- to Arduino A1
#define RX_PIN   44   // RX0 --- from Arduino A2

// --- Camera Pins (OV2640 on ESP32-S3-N16R8) ---------------------------------
#define PWDN_GPIO_NUM    -1
#define RESET_GPIO_NUM   -1
#define XCLK_GPIO_NUM    15
#define SIOD_GPIO_NUM     4
#define SIOC_GPIO_NUM     5
#define Y9_GPIO_NUM      16
#define Y8_GPIO_NUM      17
#define Y7_GPIO_NUM      18
#define Y6_GPIO_NUM      12
#define Y5_GPIO_NUM      10
#define Y4_GPIO_NUM       8
#define Y3_GPIO_NUM       9
#define Y2_GPIO_NUM      11
#define VSYNC_GPIO_NUM    6
#define HREF_GPIO_NUM     7
#define PCLK_GPIO_NUM    13

// --- WiFi & Server Config ---------------------------------------------------
const char* WIFI_SSID  = "moto";
const char* WIFI_PASS  = "11223344";
const char* API_SENSOR = "https://hydroponicdata.vercel.app/api/sensors/data";
const char* API_CAMERA = "https://hydroponicdata.vercel.app/api/camera/upload";

// --- Intervals --------------------------------------------------------------
const unsigned long CLOUD_INTERVAL = 5000UL;                // 5 seconds
const unsigned long PHOTO_INTERVAL = 30UL * 60UL * 1000UL; // 30 minutes
const unsigned long TDS_INTERVAL   = 1000UL;                // 1 second (fast LCD update)

// --- Global State -----------------------------------------------------------
HardwareSerial UnoSerial(1);  // UART1 for Arduino Uno

float sys_ph  = 7.0;
float sys_wl  = 15.0;
float sys_wt  = 25.0;
float sys_rt  = 28.0;
float sys_hum = 60.0;
float sys_tds = 0.0;
float sys_ec  = 0.0;

float local_tds = 0.0;
float local_ec  = 0.0;

bool cameraReady = false;

unsigned long lastCloudPush   = 0;
unsigned long lastPhotoUpload = 0;
unsigned long lastTdsRead     = 0;

String uartBuffer = "";

// --- TDS Reading (GPIO 2, 3.3V ADC) ----------------------------------------
float readTDS() {
  long rawSum = 0;
  for (int i = 0; i < 30; i++) {
    rawSum += analogRead(TDS_PIN);
    delay(2);
  }
  float voltage = (rawSum / 30.0f) * (3.3f / 4095.0f);

  float tempC       = (sys_wt > 0.0f && sys_wt < 100.0f) ? sys_wt : 25.0f;
  float compCoeff   = 1.0f + 0.02f * (tempC - 25.0f);
  float compVoltage = voltage / compCoeff;

  float tds = 0.0f;
  if (voltage > 0.05f) {
    tds = (133.42f * powf(compVoltage, 3)
         - 255.86f * powf(compVoltage, 2)
         + 857.39f * compVoltage) * 0.5f;
    if (tds < 0.0f) tds = 0.0f;
  }

  Serial.printf("[TDS] Voltage:%.3fV | CompV:%.3fV | TDS:%.0f ppm | Temp:%.1fC\n",
                voltage, compVoltage, tds, tempC);
  return tds;
}

// --- Camera Init ------------------------------------------------------------
bool initCamera() {
  Serial.println("[CAM] Initializing OV2640...");

  camera_config_t cfg;
  cfg.ledc_channel  = LEDC_CHANNEL_0;
  cfg.ledc_timer    = LEDC_TIMER_0;
  cfg.pin_d0        = Y2_GPIO_NUM;
  cfg.pin_d1        = Y3_GPIO_NUM;
  cfg.pin_d2        = Y4_GPIO_NUM;
  cfg.pin_d3        = Y5_GPIO_NUM;
  cfg.pin_d4        = Y6_GPIO_NUM;
  cfg.pin_d5        = Y7_GPIO_NUM;
  cfg.pin_d6        = Y8_GPIO_NUM;
  cfg.pin_d7        = Y9_GPIO_NUM;
  cfg.pin_xclk      = XCLK_GPIO_NUM;
  cfg.pin_pclk      = PCLK_GPIO_NUM;
  cfg.pin_vsync     = VSYNC_GPIO_NUM;
  cfg.pin_href      = HREF_GPIO_NUM;
  cfg.pin_sccb_sda  = SIOD_GPIO_NUM;
  cfg.pin_sccb_scl  = SIOC_GPIO_NUM;
  cfg.pin_pwdn      = PWDN_GPIO_NUM;
  cfg.pin_reset     = RESET_GPIO_NUM;
  cfg.xclk_freq_hz  = 20000000;
  cfg.pixel_format  = PIXFORMAT_JPEG;

  if (psramFound()) {
    cfg.frame_size   = FRAMESIZE_SVGA;
    cfg.jpeg_quality = 12;
    cfg.fb_count     = 2;
    cfg.fb_location  = CAMERA_FB_IN_PSRAM;
    cfg.grab_mode    = CAMERA_GRAB_LATEST;
    Serial.printf("[CAM] PSRAM OK - %d KB free\n", ESP.getFreePsram() / 1024);
  } else {
    cfg.frame_size   = FRAMESIZE_VGA;
    cfg.jpeg_quality = 15;
    cfg.fb_count     = 1;
    cfg.fb_location  = CAMERA_FB_IN_DRAM;
    cfg.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
    Serial.println("[CAM] No PSRAM - using DRAM");
  }

  esp_err_t err = esp_camera_init(&cfg);
  if (err != ESP_OK) {
    Serial.printf("[CAM] FAILED: 0x%x\n", err);
    return false;
  }

  sensor_t* s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s, 1);
    s->set_contrast(s, 1);
    s->set_saturation(s, 0);
    s->set_whitebal(s, 1);
    s->set_awb_gain(s, 1);
  }

  Serial.println("[CAM] OV2640 Ready!");
  return true;
}

// --- Photo Capture & Upload -------------------------------------------------
bool captureAndUpload(const char* trigger) {
  if (!cameraReady) { Serial.println("[CAM] Not ready"); return false; }
  if (WiFi.status() != WL_CONNECTED) { Serial.println("[CAM] No WiFi"); return false; }

  Serial.printf("[CAM] Capturing (%s)...\n", trigger);

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { Serial.println("[CAM] Frame buffer error"); return false; }
  Serial.printf("[CAM] Size: %d bytes\n", fb->len);

  size_t b64Len = 0;
  mbedtls_base64_encode(NULL, 0, &b64Len, fb->buf, fb->len);
  unsigned char* b64Buf = (unsigned char*)malloc(b64Len + 1);
  if (!b64Buf) {
    Serial.println("[CAM] malloc failed");
    esp_camera_fb_return(fb);
    return false;
  }
  mbedtls_base64_encode(b64Buf, b64Len, &b64Len, fb->buf, fb->len);
  b64Buf[b64Len] = '\0';
  esp_camera_fb_return(fb);

  String body = "{\"trigger\":\"";
  body += trigger;
  body += "\",\"image\":\"data:image/jpeg;base64,";
  body += (char*)b64Buf;
  body += "\"}";
  free(b64Buf);

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, API_CAMERA);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(25000);
  int code = http.POST(body);
  http.end();

  if (code == 200 || code == 201) {
    Serial.printf("[CAM] Uploaded! HTTP %d\n", code);
    return true;
  }
  Serial.printf("[CAM] Upload failed HTTP %d\n", code);
  return false;
}

// --- WiFi Auto-Reconnect ----------------------------------------------------
void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("[WiFi] Reconnecting");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 20 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println(" Failed.");
  }
}

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n========================================");
  Serial.println("  NutriFlow ESP32-S3-N16R8 Starting...  ");
  Serial.println("========================================");

  // STEP 1: UART to Arduino Uno
  UnoSerial.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);
  Serial.println("[UART] Started - GPIO44(RX) / GPIO43(TX)");

  // STEP 2: TDS ADC Pin
  pinMode(TDS_PIN, INPUT);
  analogReadResolution(12);
  Serial.println("[TDS] G2 (GPIO 2) configured - 3.3V ADC");

  // STEP 3: Camera
  cameraReady = initCamera();

  // STEP 4: WiFi
  Serial.printf("[WiFi] Connecting to '%s'", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) {
    delay(400); Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
    if (cameraReady) {
      delay(1500);
      captureAndUpload("boot_init");
      lastPhotoUpload = millis();
    }
  } else {
    Serial.println("\n[WiFi] Timeout - will retry in loop.");
  }

  Serial.println("\n[READY] Main loop starting...\n");
}

// ============================================================================
// LOOP
// ============================================================================
void loop() {

  // A: Read UART data from Arduino Uno
  while (UnoSerial.available() > 0) {
    char c = (char)UnoSerial.read();
    if (c == '\n') {
      uartBuffer.trim();
      if (uartBuffer.startsWith("D:")) {
        String d = uartBuffer.substring(2);
        int a = d.indexOf(',');
        int b = d.indexOf(',', a + 1);
        int cc= d.indexOf(',', b + 1);
        int e = d.indexOf(',', cc + 1);
        int f = d.indexOf(',', e + 1);
        int g = d.indexOf(',', f + 1);

        if (a > 0 && g > 0) {
          sys_ph  = d.substring(0,    a).toFloat();
          sys_wl  = d.substring(a+1,  b).toFloat();
          sys_wt  = d.substring(b+1, cc).toFloat();
          sys_rt  = d.substring(cc+1, e).toFloat();
          sys_hum = d.substring(e+1,  f).toFloat();
          sys_tds = d.substring(f+1,  g).toFloat();
          sys_ec  = d.substring(g+1    ).toFloat();

          Serial.printf("[SYNC] pH:%.1f WL:%.1f WT:%.1f RT:%.1f Hum:%.1f TDS:%.0f EC:%.2f\n",
                        sys_ph, sys_wl, sys_wt, sys_rt, sys_hum, sys_tds, sys_ec);
        }
      }
      uartBuffer = "";
    } else {
      if (uartBuffer.length() < 128) uartBuffer += c;
    }
  }

  // B: Read TDS from G2 every 1 second and dispatch to Arduino Uno immediately
  if (millis() - lastTdsRead > TDS_INTERVAL) {
    local_tds = readTDS();
    local_ec  = local_tds / 500.0f;
    lastTdsRead = millis();

    // Transmit TDS to Arduino Uno so LCD Screen A updates in real-time!
    UnoSerial.print("TDS:");
    UnoSerial.println(local_tds, 0);
    Serial.printf("[UART->UNO] Sent TDS: %.0f ppm\n", local_tds);
  }

  // C: Push sensor data to cloud every 5 seconds
  if (millis() - lastCloudPush > CLOUD_INTERVAL) {
    ensureWiFi();
    if (WiFi.status() == WL_CONNECTED) {

      float finalTDS = (sys_tds > 0.0f) ? sys_tds : local_tds;
      float finalEC  = (sys_ec  > 0.0f) ? sys_ec  : local_ec;

      WiFiClientSecure client;
      client.setInsecure();
      HTTPClient http;
      http.begin(client, API_SENSOR);
      http.addHeader("Content-Type", "application/json");
      http.setTimeout(10000);

#if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
#else
      StaticJsonDocument<256> doc;
#endif
      doc["ph"]         = sys_ph;
      doc["waterLevel"] = sys_wl;
      doc["waterTemp"]  = sys_wt;
      doc["airTemp"]    = sys_rt;
      doc["humidity"]   = sys_hum;
      doc["tds"]        = round(finalTDS);
      doc["ec"]         = finalEC;

      String payload;
      serializeJson(doc, payload);

      int code = http.POST(payload);
      if (code > 0) {
        String resp = http.getString();
#if ARDUINOJSON_VERSION_MAJOR >= 7
        JsonDocument respDoc;
#else
        StaticJsonDocument<128> respDoc;
#endif
        DeserializationError err = deserializeJson(respDoc, resp);
        if (!err) {
          bool capture = respDoc["captureRequested"] | false;
          if (capture) {
            Serial.println("[CAM] On-Demand capture from Dashboard!");
            captureAndUpload("manual_request");
            lastPhotoUpload = millis();
          }
        }
        Serial.printf("[CLOUD] Sent! HTTP %d | TDS:%.0f EC:%.2f\n", code, finalTDS, finalEC);
      } else {
        Serial.printf("[CLOUD] POST failed: %d\n", code);
      }
      http.end();
    }
    lastCloudPush = millis();
  }

  // D: Auto photo every 30 minutes
  if (cameraReady && (millis() - lastPhotoUpload >= PHOTO_INTERVAL)) {
    captureAndUpload("auto_30min");
    lastPhotoUpload = millis();
  }
}
