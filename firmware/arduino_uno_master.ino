// ============================================================================
// NutriFlow Arduino Uno Master Sensor Hub & Keypad LCD UI Firmware
// ============================================================================

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <SoftwareSerial.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>

// --- UART Setup ---
SoftwareSerial ESPSerial(A1, A2); // RX = A1, TX = A2

// --- Hardware Sensor Pins ---
#define PH_PIN A0
#define TRIG_PIN 12
#define ECHO_PIN 13
#define WATER_TEMP_PIN 10
#define DHT_PIN 11
#define DHTTYPE DHT11 // Change to DHT22 if you have the white sensor

OneWire oneWire(WATER_TEMP_PIN);
DallasTemperature waterTempSensor(&oneWire);
DHT dht(DHT_PIN, DHTTYPE);

// --- LCD & Keypad Setup ---
LiquidCrystal_I2C lcd(0x27, 16, 2);
const byte ROWS = 4; const byte COLS = 4; 
char keys[ROWS][COLS] = {
  {'1','2','3','A'}, {'4','5','6','B'}, {'7','8','9','C'}, {'*','0','#','D'}
};
byte rowPins[ROWS] = {9, 8, 7, 6}; byte colPins[COLS] = {5, 4, 3, 2}; 
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// --- Data Variables ---
float v_ph = 7.0, v_wl = 15.0, v_wt = 25.0, v_rt = 28.0, v_hum = 60.0;
float v_tds = 0.0, v_ec = 0.0;
float live_tds = 0.0; // Raw from ESP32

// Override flags
bool m_ph = false, m_wl = false, m_wt = false, m_rt = false, m_hum = false, m_tds = false, m_ec = false;

// UI Variables
int displayMode = 0; // 0=A, 1=B, 2=C, 3=D(Slideshow)
int slideIndex = 0;
int editState = 0; // 0=Viewing, >0 = Editing specific variable
String inputBuffer = "";
unsigned long lastSendTime = 0, lastSensorRead = 0, lastSlideTime = 0;

void setup() {
  Serial.begin(9600);
  ESPSerial.begin(9600);
  
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  waterTempSensor.begin();
  dht.begin();
  
  lcd.init(); lcd.backlight();
  lcd.print("System Active..."); delay(1000); lcd.clear();
}

float readHardwarePh() {
  long totalValue = 0;
  for(int i = 0; i < 10; i++) { totalValue += analogRead(PH_PIN); delay(2); }
  float voltage = (totalValue / 10.0) * (5.0 / 1023.0);
  return constrain(7.00 - 5.70 * (voltage - 2.50), 0.0, 14.0);
}

float readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); 
  return (duration == 0) ? v_wl : (duration * 0.0343) / 2.0;
}

void processKeypad() {
  char key = keypad.getKey();
  if (!key) return;

  // Mode Selection
  if (key == 'A' || key == 'B' || key == 'C' || key == 'D') {
    if(key == 'A') displayMode = 0;
    if(key == 'B') displayMode = 1;
    if(key == 'C') displayMode = 2;
    if(key == 'D') displayMode = 3; // Slideshow
    editState = 0; inputBuffer = ""; lcd.clear(); return;
  }

  // Edit Mode Logic (# cycles through inputs for the current screen)
  if (key == '#') {
    if (displayMode == 0) { // Screen A: TDS -> EC -> Exit
      editState++; if (editState > 2) editState = 0;
    } else if (displayMode == 1) { // Screen B: pH -> WL -> Exit
      editState++; if (editState > 2) editState = 0;
    } else if (displayMode == 2) { // Screen C: WT -> RT -> Hum -> Exit
      editState++; if (editState > 3) editState = 0;
    }
    
    // Process Saved Value
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
    inputBuffer = ""; lcd.clear();
  }

  // Number Input Logic
  if (editState > 0) {
    if (key >= '0' && key <= '9') { inputBuffer += key; }
    else if (key == '*') { inputBuffer += "."; } // Decimal Point
  }
}

void loop() {
  // 1. Hardware Polling
  if (millis() - lastSensorRead > 1000) {
    if (!m_ph) v_ph = readHardwarePh();
    if (!m_wl) v_wl = readUltrasonic();
    
    waterTempSensor.requestTemperatures();
    float tC = waterTempSensor.getTempCByIndex(0);
    if (!m_wt && tC > -100) v_wt = tC;
    
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (!m_hum && !isnan(h)) v_hum = h;
    if (!m_rt && !isnan(t)) v_rt = t;
    
    if (!m_tds) v_tds = live_tds;
    if (!m_ec) v_ec = live_tds / 500.0; // Standard TDS to EC formula

    lastSensorRead = millis();
  }

  // 2. Read live TDS from ESP32
  if (ESPSerial.available()) {
    String incoming = ESPSerial.readStringUntil('\n');
    incoming.trim();
    if (incoming.startsWith("TDS:")) live_tds = incoming.substring(4).toFloat();
  }

  // 3. Send ALL Final Data to ESP32 (CSV Format)
  if (millis() - lastSendTime > 1500) {
    ESPSerial.print("D:"); ESPSerial.print(v_ph); ESPSerial.print(",");
    ESPSerial.print(v_wl); ESPSerial.print(","); ESPSerial.print(v_wt); ESPSerial.print(",");
    ESPSerial.print(v_rt); ESPSerial.print(","); ESPSerial.print(v_hum); ESPSerial.print(",");
    ESPSerial.print(v_tds); ESPSerial.print(","); ESPSerial.println(v_ec);
    lastSendTime = millis();
  }

  // 4. Handle Keypad & UI
  processKeypad();

  // Slideshow logic (Mode D)
  int activeScreen = displayMode;
  if (displayMode == 3) {
    activeScreen = slideIndex;
    if (millis() - lastSlideTime > 2500) { slideIndex = (slideIndex + 1) % 3; lastSlideTime = millis(); lcd.clear(); }
  }

  // 5. LCD Rendering
  if (editState == 0) { // Viewing Mode
    if (activeScreen == 0) {
      lcd.setCursor(0,0); lcd.print(m_tds?"M":""); lcd.print("TDS: "); lcd.print(v_tds, 0); lcd.print(" ppm   ");
      lcd.setCursor(0,1); lcd.print(m_ec?"M":""); lcd.print("EC : "); lcd.print(v_ec, 2); lcd.print(" mS/cm ");
    } else if (activeScreen == 1) {
      lcd.setCursor(0,0); lcd.print(m_ph?"M":""); lcd.print("pH: "); lcd.print(v_ph, 1); lcd.print("   ");
      lcd.setCursor(0,1); lcd.print(m_wl?"M":""); lcd.print("WL: "); lcd.print(v_wl, 1); lcd.print(" cm  ");
    } else if (activeScreen == 2) {
      lcd.setCursor(0,0); lcd.print("W:"); lcd.print(v_wt,1); lcd.print(" R:"); lcd.print(v_rt,1); lcd.print("   ");
      lcd.setCursor(0,1); lcd.print(m_hum?"M":""); lcd.print("Hum: "); lcd.print(v_hum, 0); lcd.print(" %    ");
    }
  } else { // Editing Mode
    lcd.setCursor(0,0);
    if(displayMode == 0 && editState == 1) lcd.print("Set TDS:");
    else if(displayMode == 0 && editState == 2) lcd.print("Set EC:");
    else if(displayMode == 1 && editState == 1) lcd.print("Set pH:");
    else if(displayMode == 1 && editState == 2) lcd.print("Set WaterLvl:");
    else if(displayMode == 2 && editState == 1) lcd.print("Set WatTemp:");
    else if(displayMode == 2 && editState == 2) lcd.print("Set RoomTemp:");
    else if(displayMode == 2 && editState == 3) lcd.print("Set Humidity:");
    lcd.setCursor(0,1); lcd.print(inputBuffer); lcd.print("_       ");
  }
}
