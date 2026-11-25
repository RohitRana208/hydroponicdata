# 🌿 NutriFlow IoT Hydroponics System — End-to-End Technical Documentation

> **Project Name:** NutriFlow (Intelligent Hydroponic Automation & Plant Vision System)  
> **Production Dashboard URL:** [https://hydroponicdata.vercel.app/](https://hydroponicdata.vercel.app/)  
> **Database:** MongoDB Atlas Cloud Cluster (`hydrocore`)  
> **Hosting & Cloud Compute:** Vercel Serverless Architecture  

---

## 1. Executive Summary & Architecture Overview

NutriFlow is a distributed, production-grade IoT platform built specifically for precision hydroponic farming. The system operates on a **dual-microcontroller distributed edge computing model**:

1. **Edge Node 1 (Sensor Hub & UI):** Arduino Uno handles analog sensor polling (pH, Ultrasonic water level, DS18B20 water temperature, DHT11 air temperature/humidity) and local human interface (16x2 I2C LCD + 4x4 Matrix Keypad).
2. **Edge Node 2 (IoT Cloud Gateway & Vision):** ESP32-S3-N16R8 (16MB Flash, 8MB Octal PSRAM) reads TDS/EC on dedicated ADC, drives an OV2640 camera for plant health vision, maintains TLS-encrypted HTTPS connection to Vercel, and uploads telemetry to MongoDB Atlas.
3. **Cloud Infrastructure:** Vercel Serverless Edge Functions (`/api/...`) connecting to MongoDB Atlas.
4. **User Application:** Modern, responsive React 18 single-page application with real-time hardware status indicators, multi-range analytics charts, on-demand plant imaging, and CSV/Excel reporting.

---

## 2. System Architecture Block Diagram

```mermaid
flowchart TB
    subgraph EDGE_HARDWARE["🌱 EDGE HARDWARE LAYER"]
        subgraph ARDUINO_HUB["Arduino Uno (Sensor & Local UI Hub)"]
            PH["Analog pH Sensor (A0)"] --> ARDUINO_HUB
            US["HC-SR04 Ultrasonic (D12/D13)"] --> ARDUINO_HUB
            DS["DS18B20 Water Temp (D10)"] --> ARDUINO_HUB
            DHT["DHT11 Air Temp & Hum (D11)"] --> ARDUINO_HUB
            LCD["16x2 I2C LCD (A4/A5)"] <--> ARDUINO_HUB
            KEYPAD["4x4 Matrix Keypad (D2-D9)"] --> ARDUINO_HUB
        end

        subgraph ESP32_GATEWAY["ESP32-S3-N16R8 CAM (IoT Gateway & Vision)"]
            TDS["Analog TDS/EC Sensor (G2 / GPIO 2)"] --> ESP32_GATEWAY
            CAM["OV2640 2MP Camera Sensor (Internal Bus)"] --> ESP32_GATEWAY
            WIFI["2.4GHz 802.11 b/g/n Wi-Fi Engine"]
        end

        ARDUINO_HUB -- "SoftwareSerial UART (9600 baud)<br/>D:pH,WL,WT,RT,Hum,TDS,EC" --> ESP32_GATEWAY
    end

    subgraph CLOUD_BACKEND["☁️ VERCEL SERVERLESS BACKEND"]
        API_DATA["/api/sensors/data (POST/GET)"]
        API_CAM["/api/camera/upload (POST)"]
        API_TRIG["/api/camera/trigger (POST/GET)"]
        API_HIST["/api/sensors/history (GET)"]
        API_THRESH["/api/sensors/thresholds (GET/POST)"]
    end

    subgraph DATABASE["🍃 MONGODB ATLAS CLUSTER"]
        COL_SENSORS[("Collection: sensor_readings")]
        COL_CAMERA[("Collection: camera_snapshots")]
        COL_THRESH[("Collection: system_thresholds")]
        COL_TRIG[("Collection: camera_triggers")]
    end

    subgraph FRONTEND["💻 USER DASHBOARD (React 18 + Vite)"]
        UI_METRICS["Live Sensor Cards (7 Parameters)"]
        UI_CHARTS["Recharts Dynamic Analytics (1h/2h/5h/10h/20h/All)"]
        UI_CAM["Plant Vision & 48h Timelapse Gallery"]
        UI_LIVE["On-Demand 'Capture Now' Trigger"]
        UI_EXPORT["Excel / CSV Data Exporter"]
    end

    ESP32_GATEWAY -- "HTTPS POST (every 5s)" --> API_DATA
    ESP32_GATEWAY -- "HTTPS POST (Base64 JPEG)" --> API_CAM
    ESP32_GATEWAY -- "Polls Trigger Status" --> API_DATA

    API_DATA --> COL_SENSORS
    API_CAM --> COL_CAMERA
    API_TRIG --> COL_TRIG
    API_HIST --> COL_SENSORS
    API_THRESH --> COL_THRESH

    FRONTEND <--> CLOUD_BACKEND
```

---

## 3. Hardware Architecture & Complete Wiring Pinout

### 3.1 Bill of Materials (BOM)

| Component | Specification | Operating Voltage | Interface | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Arduino Uno R3** | ATmega328P, 16MHz, 5V | 5V DC (USB / 9V DC) | UART / I2C / Digital | Master Sensor Hub & UI Controller |
| **ESP32-S3-N16R8 CAM** | Dual-core Xtensa LX7, 16MB Flash, 8MB OPI PSRAM | 5V DC (USB-TTL Port) | Wi-Fi / UART / ADC / Camera DVP | Cloud Gateway, TDS reader & Vision Node |
| **OV2640 Camera** | 2 Megapixel CMOS Image Sensor | 3.3V (On-board) | DVP 8-bit Parallel Bus | Plant health imaging & Timelapse capture |
| **Analog TDS Sensor** | Gravity Analog TDS probe & signal board | 3.3V – 5.0V | Analog Voltage (0 – 2.3V) | Total Dissolved Solids & EC monitoring |
| **Analog pH Sensor** | E-201-C BNC glass electrode + amplifier | 5.0V | Analog Voltage (0 – 5.0V) | Nutrient solution acidity/alkalinity |
| **HC-SR04** | Ultrasonic Distance Sensor | 5.0V | Digital Trigger / Echo Pulse | Reservoir water level calculation |
| **DS18B20** | Waterproof Digital Temperature Probe | 5.0V (4.7kΩ pull-up) | 1-Wire Digital Bus | Root zone / water temperature |
| **DHT11** | Relative Humidity & Ambient Temperature | 5.0V | Single-Bus Digital | Environmental grow-room climate |
| **LCD 16x2 + I2C Backpack**| HD44780 with PCF8574T I2C module (0x27) | 5.0V | I2C (SDA/SCL) | Local real-time telemetry display |
| **4x4 Matrix Keypad** | Membrane matrix switch (16 keys) | 5.0V | 8 Digital GPIO lines | Local calibration, overrides & screen toggle |

---

### 3.2 Inter-Board Communication (UART Bridge)

The Arduino Uno communicates with the ESP32-S3 over full-duplex asynchronous serial.

```
Arduino Uno (5V Logic)                    ESP32-S3-N16R8 (3.3V Logic)
┌──────────────────────┐                  ┌────────────────────────┐
│                      │                  │                        │
│   Pin A2 (Soft TX)   ├─────────────────►│ RX0 (GPIO 44)          │
│   Pin A1 (Soft RX)   │◄─────────────────┤ TX0 (GPIO 43)          │
│   GND                ├──────────────────┤ GND (Common Reference) │
│                      │                  │                        │
└──────────────────────┘                  └────────────────────────┘
```

> [!IMPORTANT]
> **Common Ground (`GND`) is Mandatory!** The GND pin of Arduino Uno must be directly connected to the GND pin of the ESP32-S3 board to establish an identical reference potential. Without this, serial packets will corrupt.

#### UART Data Packet Specification (CSV Stream):
* **Arduino to ESP32:** Transmitted every 1.5 seconds at 9600 baud:
  ```text
  D:<pH>,<waterLevel>,<waterTemp>,<roomTemp>,<humidity>,<tds>,<ec>\n
  ```
  *Example:* `D:6.2,14.8,23.5,27.1,65.0,850,1.70\n`
* **ESP32 to Arduino:** Transmitted when local TDS is sampled:
  ```text
  TDS:<ppm_value>\n
  ```
  *Example:* `TDS:850\n`

---

### 3.3 Pin Assignment Tables

#### A. Arduino Uno Pin Mapping

| Peripheral | Arduino Uno Pin | Wire Color / Connection | Notes |
| :--- | :--- | :--- | :--- |
| **pH Sensor Signal** | `A0` | Yellow | 0-5V analog input (calibrated: 7.00 - 5.70*(V - 2.50)) |
| **Software Serial RX** | `A1` | From ESP32 TX0 (GPIO 43) | Receives live TDS / commands |
| **Software Serial TX** | `A2` | To ESP32 RX0 (GPIO 44) | Transmits unified CSV telemetry stream |
| **Reserved / Aux** | `A3` | Optional Analog | Backup 5V TDS sensor input |
| **I2C SDA (LCD)** | `A4` | SDA line | Hardware I2C data |
| **I2C SCL (LCD)** | `A5` | SCL line | Hardware I2C clock |
| **Keypad Column 4** | `D2` | Pin 8 of ribbon | Col Pin 4 |
| **Keypad Column 3** | `D3` | Pin 7 of ribbon | Col Pin 3 |
| **Keypad Column 2** | `D4` | Pin 6 of ribbon | Col Pin 2 |
| **Keypad Column 1** | `D5` | Pin 5 of ribbon | Col Pin 1 |
| **Keypad Row 4** | `D6` | Pin 4 of ribbon | Row Pin 4 |
| **Keypad Row 3** | `D7` | Pin 3 of ribbon | Row Pin 3 |
| **Keypad Row 2** | `D8` | Pin 2 of ribbon | Row Pin 2 |
| **Keypad Row 1** | `D9` | Pin 1 of ribbon | Row Pin 1 |
| **DS18B20 1-Wire** | `D10` | Yellow (Data) | Requires 4.7kΩ resistor between Data & 5V |
| **DHT11 Sensor** | `D11` | Yellow / Blue | Ambient temperature and humidity data |
| **Ultrasonic TRIG** | `D12` | Trigger pin | 10µs trigger pulse |
| **Ultrasonic ECHO** | `D13` | Echo pin | Pulse duration converted to reservoir height (cm) |
| **Power Bus (5V)** | `5V` | Red rail | Supplies Sensors, LCD, DHT11, DS18B20 |
| **Ground Bus (GND)** | `GND` | Black rail | Common ground |

---

#### B. ESP32-S3-N16R8 CAM Pin Mapping

| Function | ESP32-S3 Pin | Safe / Dedicated | Notes |
| :--- | :--- | :--- | :--- |
| **TDS Sensor Signal** | **`G2` (GPIO 2)** | **ADC1_CH1** | **Safe Analog Input.** 3.3V reference. Averaged over 30 samples. |
| **TDS Sensor VCC** | **`3V3`** | **3.3V Power** | **Do NOT connect TDS to 5V when using ESP32 ADC!** |
| **TDS Sensor GND** | **`GND`** | **Ground** | Ground reference |
| **UART1 RX** | **`RX0` (GPIO 44)** | **Hardware Serial** | Connected to Arduino `A2` (TX) |
| **UART1 TX** | **`TX0` (GPIO 43)** | **Hardware Serial** | Connected to Arduino `A1` (RX) |
| **OV2640 SIOD (SDA)** | `GPIO 4` | Dedicated Camera | I2C Data for camera SCCB |
| **OV2640 SIOC (SCL)** | `GPIO 5` | Dedicated Camera | I2C Clock for camera SCCB |
| **OV2640 VSYNC** | `GPIO 6` | Dedicated Camera | Frame synchronization |
| **OV2640 HREF** | `GPIO 7` | Dedicated Camera | Line synchronization |
| **OV2640 Y4 (D2)** | `GPIO 8` | Dedicated Camera | Pixel data bit 2 |
| **OV2640 Y3 (D1)** | `GPIO 9` | Dedicated Camera | Pixel data bit 1 |
| **OV2640 Y5 (D3)** | `GPIO 10` | Dedicated Camera | Pixel data bit 3 |
| **OV2640 Y2 (D0)** | `GPIO 11` | Dedicated Camera | Pixel data bit 0 |
| **OV2640 Y6 (D4)** | `GPIO 12` | Dedicated Camera | Pixel data bit 4 |
| **OV2640 PCLK** | `GPIO 13` | Dedicated Camera | Pixel clock |
| **OV2640 XCLK** | `GPIO 15` | Dedicated Camera | Master clock (20MHz) |
| **OV2640 Y9 (D7)** | `GPIO 16` | Dedicated Camera | Pixel data bit 7 |
| **OV2640 Y8 (D6)** | `GPIO 17` | Dedicated Camera | Pixel data bit 6 |
| **OV2640 Y7 (D5)** | `GPIO 18` | Dedicated Camera | Pixel data bit 5 |

> [!CAUTION]
> **Pins `GPIO 4` to `GPIO 18` belong exclusively to the high-speed OV2640 camera bus.** Under no circumstances should any sensor or jumper wire be attached to pins G4–G18, as doing so causes instant camera probe failure (`0x106 ESP_ERR_NOT_SUPPORTED`).

---

## 4. Software & Firmware Architecture

### 4.1 Technology & Framework Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NUTRIFLOW SOFTWARE STACK                        │
├───────────────────────┬────────────────────────────────────────────────┤
│ Layer                 │ Technologies / Libraries                       │
├───────────────────────┼────────────────────────────────────────────────┤
│ Edge Firmware (Uno)   │ C++, Arduino Core, LiquidCrystal_I2C, Keypad,  │
│                       │ DallasTemperature, OneWire, DHT sensor library │
├───────────────────────┼────────────────────────────────────────────────┤
│ Edge Firmware (ESP32) │ C++, ESP32 Arduino Core 3.x, esp_camera,       │
│                       │ WiFiClientSecure, HTTPClient, ArduinoJson v6/v7│
│                       │ mbedtls (Base64 engine)                        │
├───────────────────────┼────────────────────────────────────────────────┤
│ Cloud Serverless API  │ Node.js 18+ (ES Modules), Express/Vercel Edge, │
│                       │ MongoDB Official Driver v6.8, Mongoose v8.6    │
├───────────────────────┼────────────────────────────────────────────────┤
│ Cloud Database        │ MongoDB Atlas (Replica Set Cluster, AWS us-east)│
├───────────────────────┼────────────────────────────────────────────────┤
│ Web Application       │ React 18.3, Vite 5.4, Tailwind CSS 3.4,        │
│                       │ Recharts 2.12, Lucide React icons, XLSX (SheetJS)│
└───────────────────────┴────────────────────────────────────────────────┘
```

---

### 4.2 Firmware Operation Logic

#### A. Arduino Uno Master Workflow
1. **1000ms Polling Loop:**
   - Reads analog pH on `A0` (10-sample smoothed ADC).
   - Triggers ultrasonic ping on `D12` / listens on `D13` to calculate distance.
   - Reads DS18B20 digital temperature over 1-Wire (`D10`).
   - Reads DHT11 relative humidity and ambient temperature (`D11`).
2. **Keypad & UI Management:**
   - Pressing **`A`**: Screen 1 (TDS & EC live status).
   - Pressing **`B`**: Screen 2 (pH & Reservoir Water Level).
   - Pressing **`C`**: Screen 3 (Water Temperature, Room Temperature & Humidity).
   - Pressing **`D`**: Auto-slideshow cycling every 2.5 seconds.
   - Pressing **`#`**: Manual variable calibration / override mode.
3. **Serial Broadcast:**
   - Assembles comma-separated string `D:pH,WL,WT,RT,Hum,TDS,EC\n` and sends to ESP32 every 1500ms via SoftwareSerial (`A2`).

#### B. ESP32-S3 Gateway & Vision Workflow
1. **Setup Phase:**
   - Initializes Serial debug (`115200 baud`) and HardwareSerial1 (`9600 baud, GPIO 44 RX, GPIO 43 TX`).
   - Configures `GPIO 2` for 12-bit ADC (`0 – 4095`).
   - Allocates camera frame buffers in 8MB Octal PSRAM (`FRAMESIZE_SVGA`, 800x600 resolution, JPEG quality 12).
   - Connects to Wi-Fi SSID with auto-retry and takes a `"boot_init"` plant snapshot.
2. **Main Loop Execution:**
   - **Non-blocking UART parser:** Ingests the `D:...` stream from Arduino, parses floats into global variables.
   - **TDS Sampling (every 2s):** Reads 30 ADC samples on `G2`, applies 3.3V scaling, computes temperature-compensated EC and TDS formulas.
   - **Cloud Push (every 5s):** Transmits JSON payload over TLS to `/api/sensors/data`.
   - **Remote Command Interception:** Reads response JSON from `/api/sensors/data`. If `captureRequested == true`, immediately triggers camera, base64 encodes the frame buffer, and posts to `/api/camera/upload`.
   - **Timelapse Timer (every 30 mins):** Captures auto snapshot with trigger tag `"auto_30min"`.

---

## 5. Cloud Backend Architecture (Vercel Serverless)

The backend is built as serverless REST endpoints located under `/api/`:

| Endpoint | Method | Purpose | Request Body / Query | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| `/api/sensors/data` | `POST` | Ingests live telemetry from ESP32 | `{ ph, waterLevel, waterTemp, airTemp, humidity, tds, ec }` | Inserts document into `sensor_readings`. Checks `camera_triggers` and returns `{ captureRequested: boolean }`. |
| `/api/sensors/latest` | `GET` | Returns the single most recent reading | None | Query: `find().sort({ timestamp: -1 }).limit(1)` |
| `/api/sensors/history` | `GET` | Returns historical points for charts | `?hours=1` / `2` / `5` / `10` / `20` / `all` | Aggregates documents within timestamp range, downsamples if >300 points. |
| `/api/sensors/thresholds` | `GET/POST` | Read or update min/max alarm setpoints | `{ phMin, phMax, tdsMin, tdsMax, ... }` | Updates singleton configuration document in `system_thresholds`. |
| `/api/camera/upload` | `POST` | Receives Base64 JPEG photo from ESP32 | `{ trigger: string, image: string }` | Stores snapshot document in `camera_snapshots` directly in MongoDB. Resets pending triggers. |
| `/api/camera/latest` | `GET` | Fetches the newest plant photo | None | Returns most recent photo document with timestamp and trigger type. |
| `/api/camera/history` | `GET` | Fetches 48-hour timelapse images | None | Returns up to 96 most recent snapshots for the gallery and timelapse scrub. |
| `/api/camera/trigger` | `POST/GET`| Triggers an instant "Capture Now" photo | `POST`: `{}` / `GET`: checks flag | Sets `captureRequested: true` in `camera_triggers` collection. |

---

## 6. Database Schema Design (MongoDB Atlas)

### 6.1 Collection: `sensor_readings`
```json
{
  "_id": { "$oid": "66db8f12a3bc91024e123456" },
  "timestamp": { "$date": "2026-09-07T11:45:00.000Z" },
  "ph": 6.25,
  "waterLevel": 78.4,
  "waterTemp": 23.8,
  "airTemp": 28.2,
  "humidity": 68.0,
  "tds": 790,
  "ec": 1.58
}
```
*Indexes:* `{ "timestamp": -1 }` (TTL optional for auto-archival).

### 6.2 Collection: `camera_snapshots`
```json
{
  "_id": { "$oid": "66db8f12a3bc91024e654321" },
  "timestamp": { "$date": "2026-09-07T11:30:00.000Z" },
  "trigger": "auto_30min",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD..."
}
```
*Indexes:* `{ "timestamp": -1 }`. Retains up to 96 snapshots (48 hours of 30-minute intervals).

### 6.3 Collection: `camera_triggers`
```json
{
  "_id": "singleton_trigger_state",
  "captureRequested": false,
  "lastRequestedAt": { "$date": "2026-09-07T11:22:15.000Z" },
  "lastCapturedAt": { "$date": "2026-09-07T11:22:20.000Z" }
}
```

---

## 7. Frontend Application Architecture (React 18 Dashboard)

The user interface is a single-page application configured with Vite and styled using Tailwind CSS:

### 7.1 Key Features & Component Hierarchy
* **`Header.jsx`:**
  * Displays system status with **real hardware heartbeat tracking**: calculates delta between browser time and latest reading timestamp. Shows `ONLINE` (emerald badge) if reading age is under 25 seconds; otherwise switches to `OFFLINE / DISCONNECTED` with elapsed time counter.
  * Theme Switcher: Seamless toggling between **Light Mode** (clean white with emerald accents) and **Dark Mode** (slate-900 with neon accents).
* **`SensorGrid.jsx` & `SensorCard.jsx`:**
  * 7 Telemetry Cards: **pH Level, TDS Concentration, Electrical Conductivity (EC), Water Level, Water Temperature, Room Temperature, Relative Humidity**.
  * Shows dynamic threshold alarm indicators (Warning badge when reading falls outside user-defined range).
* **`PlantCameraSection.jsx`:**
  * Real-time preview of latest plant canopy image.
  * **"⚡ Capture Now" Action:** Sends instant trigger to `/api/camera/trigger`. Shows live capture countdown while ESP32 executes snapshot.
  * **48-Hour Timelapse Gallery:** Interactive slider allowing growers to scrub through 30-minute interval photos over the last 2 days to visualize growth rates and detect leaf nutrient deficiencies.
* **`WaterChemistryChart.jsx` & `EnvironmentalChart.jsx`:**
  * Built using `recharts`.
  * **Dynamic Time Range Filter Buttons:** `1h`, `2h`, `5h`, `10h`, `20h`, and `All`.
  * Interactive tooltips with synchronized crosshairs.
* **`ThresholdSettings.jsx`:**
  * Modal interface to customize min/max safety limits for every sensor. Persisted directly to MongoDB Atlas.
* **`DownloadButton.jsx`:**
  * Generates formatted Excel (`.xlsx`) or comma-separated (`.csv`) audit reports containing all historical telemetry.

---

## 8. Step-by-Step Flashing & Deployment Guide

### 8.1 Arduino Uno Setup
1. Open [firmware/arduino_uno_master.ino](file:///Users/rohitsinghrana/Documents/devansh/firmware/arduino_uno_master.ino) in Arduino IDE.
2. Install required libraries via Library Manager (`Ctrl+Shift+I`):
   - `LiquidCrystal_I2C` by Frank de Brabander
   - `Keypad` by Mark Stanley
   - `DallasTemperature` by Miles Burton
   - `OneWire` by Paul Stoffregen
   - `DHT sensor library` by Adafruit
3. Select **Tools > Board > Arduino AVR Boards > Arduino Uno**.
4. Select the corresponding USB COM Port and click **Upload**.

---

### 8.2 ESP32-S3-N16R8 CAM Setup
1. Open [firmware/esp32_s3_gateway.ino](file:///Users/rohitsinghrana/Documents/devansh/firmware/esp32_s3_gateway.ino) in Arduino IDE.
2. Ensure ESP32 Board package is installed (**Board Manager > esp32 by Espressif**).
3. Connect USB cable to the **TTL Type-C port** (the port connected to the CH340C chip).
4. Configure **Tools** menu settings exactly as follows:
   * **Board:** `ESP32S3 Dev Module`
   * **USB CDC On Boot:** `Enabled`
   * **CPU Frequency:** `240MHz (WiFi)`
   * **Flash Mode:** `QIO 80MHz`
   * **Flash Size:** `16MB (128Mb)`
   * **Partition Scheme:** `Huge APP (3MB No OTA/1MB SPIFFS)`
   * **PSRAM:** `OPI PSRAM`  *(Essential for OV2640 SVGA frame buffer)*
   * **Upload Speed:** `921600`
5. Click **Upload**. Open Serial Monitor at **`115200 baud`** to verify Wi-Fi connection and camera initialization.

---

### 8.3 Vercel Environment Variables Configuration
In your Vercel Project Dashboard (`Settings > Environment Variables`), ensure the following variable is defined:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://devansh:*****@cluster0.tlrcezo.mongodb.net/hydrocore` | Connection URI to MongoDB Atlas Cluster |

---

## 9. Verification & Health Checklist

- [x] **Arduino LCD:** Shows `TDS: xxx ppm` & `EC: x.xx` on Screen A, `pH: x.x` on Screen B.
- [x] **UART Bridge:** ESP32 Serial Monitor prints `[SYNC] pH:.. WL:.. TDS:..` every 1.5s.
- [x] **Cloud Ingestion:** ESP32 Serial Monitor prints `[CLOUD] Sent! HTTP 200` every 5s.
- [x] **Web Dashboard Status:** Header displays green pulse with text `SYSTEM ONLINE`.
- [x] **Plant Vision:** Boot snapshot appears under Plant Vision card. Clicking **Capture Now** updates the image within 10-15 seconds.
- [x] **Analytics:** Recharts graphs respond to 1h, 2h, 5h, 10h, 20h, and All filters.
