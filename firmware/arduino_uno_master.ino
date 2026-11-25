// ============================================================================
// NutriFlow Arduino Uno Master Sensor Hub & Keypad LCD UI Firmware
// ============================================================================
// Pins Used:
//   - pH Sensor Probe    : A0 (Analog 5V)
//   - Ultrasonic Trigger : D12
//   - Ultrasonic Echo    : D13
//   - DS18B20 Water Temp : D10 (4.7k resistor to 5V)
//   - DHT11 Room Climate : D11
//   - 16x2 LCD (I2C)     : A4 (SDA), A5 (SCL)
//   - 4x4 Matrix Keypad  : D2-D9
//   - UART to ESP32-S3   : A1 (RX from ESP32 TX0), A2 (TX to ESP32 RX0)
// ============================================================================

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <SoftwareSerial.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>

// --- UART Setup to ESP32-S3 ---
// Connect Arduino A1 (RX) ---> ESP32 TX0 (GPIO 43)
// Connect Arduino A2 (TX) ---> ESP32 RX0 (GPIO 44)
// Connect Arduino GND     ---> ESP32 GND
SoftwareSerial ESPSerial(A1, A2); // RX = A1, TX = A2

// --- Hardware Sensor Pins ---
#define PH_PIN A0
#define TRIG_PIN 12
#define ECHO_PIN 13
#define WATER_TEMP_PIN 10
#define DHT_PIN 11
#define DHTTYPE DHT11 // Set to DHT22 if white sensor used

OneWire oneWire(WATER_TEMP_PIN);
DallasTemperature waterTempSensor(&oneWire);
DHT dht(DHT_PIN, DHTTYPE);

// --- LCD & Keypad Setup ---
LiquidCrystal_I2C lcd(0x27, 16, 2);
const byte ROWS = 4;
const byte COLS = 4; 
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte rowPins[ROWS] = {9, 8, 7, 6};
byte colPins[COLS] = {5, 4, 3, 2}; 
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// --- Data Variables ---
float v_ph = 7.0;
float v_wl = 15.0;
float v_wt = 25.0;
float v_rt = 28.0;
float v_hum = 60.0;
float v_tds = 0.0;
float v_ec  = 0.0;
float live_tds = 0.0; // Live TDS received from ESP32

// Manual override flags (set via Keypad # key)
bool m_ph = false, m_wl = false, m_wt = false, m_rt = false, m_hum = false, m_tds = false, m_ec = false;

// UI State Variables
int displayMode = 0; // 0=A, 1=B, 2=C, 3=D (Slideshow)
int slideIndex = 0;
int editState = 0;   // 0=Viewing, >0 = Editing specific variable
String inputBuffer = "";
String espRxBuffer = "";

unsigned long lastSendTime = 0;
unsigned long lastSensorRead = 0;
unsigned long lastSlideTime = 0;

void setup() {
  Serial.begin(9600);
  ESPSerial.begin(9600);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  waterTempSensor.begin();
  dht.begin();
  
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("NutriFlow Active");
  lcd.setCursor(0, 1);
  lcd.print("Syncing ESP32...");
  delay(1200);
  lcd.clear();

  Serial.println(F("[ARDUINO] NutriFlow Master Node Online"));
  Serial.println(F("[ARDUINO] Listening for live TDS on SoftwareSerial (A1/A2)..."));
}

float readHardwarePh() {
  long totalValue = 0;
  for (int i = 0; i < 10; i++) {
    totalValue += analogRead(PH_PIN);
    delay(2);
  }
  float voltage = (totalValue / 10.0f) * (5.0f / 1023.0f);
  return constrain(7.00f - 5.70f * (voltage - 2.50f), 0.0f, 14.0f);
}

float readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); 
  return (duration == 0) ? v_wl : (duration * 0.0343f) / 2.0f;
}

void processKeypad() {
  char key = keypad.getKey();
  if (!key) return;

  // Mode Selection (A, B, C, D)
  if (key == 'A' || key == 'B' || key == 'C' || key == 'D') {
    if (key == 'A') displayMode = 0; // TDS & EC
    if (key == 'B') displayMode = 1; // pH & Water Level
    if (key == 'C') displayMode = 2; // Temperatures & Humidity
    if (key == 'D') displayMode = 3; // Automated Slideshow
    editState = 0;
    inputBuffer = "";
    lcd.clear();
    return;
  }

  // Edit Mode Logic (# cycles through editable fields)
  if (key == '#') {
    if (displayMode == 0) { // Screen A: TDS -> EC -> Exit
      editState++;
      if (editState > 2) editState = 0;
    } else if (displayMode == 1) { // Screen B: pH -> WL -> Exit
      editState++;
      if (editState > 2) editState = 0;
    } else if (displayMode == 2) { // Screen C: WT -> RT -> Hum -> Exit
      editState++;
      if (editState > 3) editState = 0;
    }
    
    // Save entered value when exiting an input state
    if (inputBuffer.length() > 0) {
      float val = inputBuffer.toFloat();
      if (displayMode == 0 && editState == 2) { v_tds = val; m_tds = true; }
      else if (displayMode == 0 && editState == 0) { v_ec = val; m_ec = true; }
      else if (displayMode == 1 && editState == 2) { v_ph = val; m_ph = true; }
      else if (displayMode == 1 && editState == 0) { v_wl = val; m_wl = true; }
      else if (displayMode == 2 && editState == 2) { v_wt = val; m_wt = true; }
      else if (displayMode == 2 && editState == 3) { v_rt = val; m_rt = true; }
      else if (displayMode == 2 && editState == 0) { v_hum = val; m_hum = true; }
    }
    inputBuffer = "";
    lcd.clear();
  }

  // Numeric digit input
  if (editState > 0) {
    if (key >= '0' && key <= '9') {
      inputBuffer += key;
    } else if (key == '*') {
      inputBuffer += "."; // Decimal point
    }
  }
}

void loop() {
  // ── 1. Local Hardware Sensors Polling (Every 1000ms) ────────────────────────
  if (millis() - lastSensorRead > 1000) {
    waterTempSensor.requestTemperatures();
    float tC = waterTempSensor.getTempCByIndex(0);
    if (!m_wt && tC > -100) v_wt = tC;

    if (!m_ph) v_ph = readHardwarePh();
    if (!m_wl) v_wl = readUltrasonic();
    
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (!m_hum && !isnan(h)) v_hum = h;
    if (!m_rt  && !isnan(t)) v_rt = t;

    lastSensorRead = millis();
  }

  // ── 2. Read Live TDS Stream from ESP32 (Non-blocking UART) ─────────────────
  while (ESPSerial.available() > 0) {
    char c = (char)ESPSerial.read();
    if (c == '\n') {
      espRxBuffer.trim();
      if (espRxBuffer.startsWith("TDS:")) {
        live_tds = espRxBuffer.substring(4).toFloat();
        if (!m_tds) {
          v_tds = live_tds;
          v_ec  = live_tds / 500.0f;
        }
        Serial.print(F("[RX ESP32] Live TDS: "));
        Serial.print(v_tds, 0);
        Serial.print(F(" ppm | EC: "));
        Serial.println(v_ec, 2);
      }
      espRxBuffer = "";
    } else {
      if (espRxBuffer.length() < 32) {
        espRxBuffer += c;
      }
    }
  }

  // ── 3. Dispatch Consolidated Telemetry to ESP32 (Every 1500ms) ─────────────
  if (millis() - lastSendTime > 1500) {
    ESPSerial.print("D:");
    ESPSerial.print(v_ph, 1);
    ESPSerial.print(",");
    ESPSerial.print(v_wl, 1);
    ESPSerial.print(",");
    ESPSerial.print(v_wt, 1);
    ESPSerial.print(",");
    ESPSerial.print(v_rt, 1);
    ESPSerial.print(",");
    ESPSerial.print(v_hum, 0);
    ESPSerial.print(",");
    ESPSerial.print(v_tds, 0);
    ESPSerial.print(",");
    ESPSerial.println(v_ec, 2);
    lastSendTime = millis();
  }

  // ── 4. Keypad Input Handling ───────────────────────────────────────────────
  processKeypad();

  // ── 5. Slideshow Index Logic (Mode D) ──────────────────────────────────────
  int activeScreen = displayMode;
  if (displayMode == 3) {
    activeScreen = slideIndex;
    if (millis() - lastSlideTime > 2500) {
      slideIndex = (slideIndex + 1) % 3;
      lastSlideTime = millis();
      lcd.clear();
    }
  }

  // ── 6. LCD Display Rendering ───────────────────────────────────────────────
  if (editState == 0) {
    // Normal Viewing Mode
    if (activeScreen == 0) {
      // Screen A: TDS & EC
      lcd.setCursor(0, 0);
      if (m_tds) lcd.print("M");
      lcd.print("TDS: ");
      lcd.print(v_tds, 0);
      lcd.print(" ppm    ");

      lcd.setCursor(0, 1);
      if (m_ec) lcd.print("M");
      lcd.print("EC : ");
      lcd.print(v_ec, 2);
      lcd.print(" mS/cm  ");
    } else if (activeScreen == 1) {
      // Screen B: pH & Water Level
      lcd.setCursor(0, 0);
      if (m_ph) lcd.print("M");
      lcd.print("pH : ");
      lcd.print(v_ph, 1);
      lcd.print("      ");

      lcd.setCursor(0, 1);
      if (m_wl) lcd.print("M");
      lcd.print("WL : ");
      lcd.print(v_wl, 1);
      lcd.print(" cm   ");
    } else if (activeScreen == 2) {
      // Screen C: Temperatures & Humidity
      lcd.setCursor(0, 0);
      lcd.print("W:");
      lcd.print(v_wt, 1);
      lcd.print("C R:");
      lcd.print(v_rt, 1);
      lcd.print("C  ");

      lcd.setCursor(0, 1);
      if (m_hum) lcd.print("M");
      lcd.print("Hum: ");
      lcd.print(v_hum, 0);
      lcd.print(" %      ");
    }
  } else {
    // Interactive Edit Mode
    lcd.setCursor(0, 0);
    if      (displayMode == 0 && editState == 1) lcd.print("Set TDS (ppm):  ");
    else if (displayMode == 0 && editState == 2) lcd.print("Set EC (mS/cm): ");
    else if (displayMode == 1 && editState == 1) lcd.print("Set pH:         ");
    else if (displayMode == 1 && editState == 2) lcd.print("Set Water Level:");
    else if (displayMode == 2 && editState == 1) lcd.print("Set Water Temp: ");
    else if (displayMode == 2 && editState == 2) lcd.print("Set Room Temp:  ");
    else if (displayMode == 2 && editState == 3) lcd.print("Set Humidity:   ");

    lcd.setCursor(0, 1);
    lcd.print(inputBuffer);
    lcd.print("_             ");
  }
}
