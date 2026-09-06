// ============================================================================
// NutriFlow ESP32-S3 Cloud Gateway & TDS Module Firmware
// ============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

#define TDS_PIN 4
#define TX_PIN 17  
#define RX_PIN 18  

HardwareSerial UnoSerial(1); 

const char* ssid = "moto";
const char* password = "11223344";
const char* serverUrl = "https://hydroponicdata.vercel.app/api/sensors/data";
const float AIR_VOLTAGE_BASELINE = 2.23; 

// Master Data Array from Arduino
float sys_ph = 7.0, sys_wl = 15.0, sys_wt = 25.0, sys_rt = 28.0, sys_hum = 60.0, sys_tds = 0.0, sys_ec = 0.0;
float localTDS = 0.0;

unsigned long lastCloudPush = 0;
unsigned long lastUartPush = 0;

void setup() {
  Serial.begin(115200); 
  UnoSerial.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN); 
  pinMode(TDS_PIN, INPUT_PULLDOWN); 
  
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) { delay(500); }
}

void loop() {
  // 1. Read CSV Data from Arduino Master
  if (UnoSerial.available()) {
    String incoming = UnoSerial.readStringUntil('\n');
    incoming.trim();
    // Format -> D:pH,WL,WT,RT,Hum,TDS,EC
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

  // 2. Read Local TDS Hardware
  long rawSum = 0;
  for(int i=0; i<10; i++) { rawSum += analogRead(TDS_PIN); delay(2); }
  float rawVoltage = (rawSum/10.0) * (3.3 / 4095.0); 
  float actualVoltage = max(0.0f, (float)(rawVoltage - AIR_VOLTAGE_BASELINE));
  
  localTDS = 0;
  if (actualVoltage > 0.1) { 
    localTDS = (133.42 * pow(actualVoltage, 3) - 255.86 * pow(actualVoltage, 2) + 857.39 * actualVoltage) * 0.5;
  }

  // 3. Send Local TDS to Arduino (Every 1 Sec)
  if(millis() - lastUartPush > 1000) {
    UnoSerial.print("TDS:"); UnoSerial.println(localTDS, 0);
    lastUartPush = millis();
  }

  // 4. Send All Unified Data to Dashboard (Every 5 Sec)
  if (millis() - lastCloudPush > 5000) {
    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client; client.setInsecure(); 
      HTTPClient http;
      http.begin(client, serverUrl);
      http.addHeader("Content-Type", "application/json");

      StaticJsonDocument<256> doc;
      doc["tds"] = round(sys_tds);
      doc["ec"] = sys_ec;
      doc["ph"] = sys_ph; 
      doc["waterLevel"] = sys_wl;
      doc["waterTemp"] = sys_wt;
      doc["airTemp"] = sys_rt; 
      doc["humidity"] = sys_hum; 

      String jsonPayload;
      serializeJson(doc, jsonPayload);
      int code = http.POST(jsonPayload);
      
      if(code > 0) Serial.printf("☁️ [CLOUD] Sync OK: %d\n", code);
      http.end();
    }
    lastCloudPush = millis();
  }
}
