# NutriFlow: Smart IoT Hydroponic Monitoring & Plant Vision System
## Comprehensive Technical Documentation and Engineering Manual

---

### Executive Summary

**NutriFlow** is an enterprise-grade Internet of Things (IoT) and Edge Computer Vision hydroponics monitoring platform. It provides continuous, real-time surveillance of vital biochemical, physical, and environmental parameters essential for soilless cultivation. 

The system leverages a decoupled dual-microcontroller edge architecture comprising an **Arduino Uno R3** (dedicated to high-reliability analog/digital sensor polling and physical user interface interaction) and an **ESP32-S3-N16R8 CAM** (dedicated to high-bandwidth edge computer vision, data synchronization, and secure TLS cloud communications). Data is persisted in a distributed **MongoDB Atlas** cluster and displayed via a responsive, cloud-native web dashboard hosted on **Vercel**.

- **Production URL:** https://hydroponicdata.vercel.app/
- **Firmware Directory:** `firmware/`
- **Database Engine:** MongoDB Atlas (Database: `hydrocore`)
- **Hosting Platform:** Vercel (Edge & Serverless Functions)

---

## 1. System Architecture and Edge Topology

```
+---------------------------------------------------------------------------------------------------------+
|                                    HYDROPONIC SENSOR ARTIFACTS                                          |
|                                                                                                         |
|  [pH Probe]         [HC-SR04 Ultrasonic]     [DS18B20 Temp Probe]     [DHT11 Sensor]     [TDS Probe]   |
|   (Analog)            (Echo / Trigger)         (OneWire Bus)          (Single Bus)         (Analog)     |
+-------+--------------------+-------------------------+----------------------+-----------------+---------+
        |                    |                         |                      |                 |
        | 5V Analog          | 5V Digital              | 5V OneWire           | 5V Digital      | 3.3V Analog
        v                    v                         v                      v                 |
+-----------------------------------------------------------------------------------+           |
|                           ARDUINO UNO R3 (SENSOR HUB & UI)                        |           |
|                                                                                   |           |
|  - Analog Front-End: A0 (pH)                                                      |           |
|  - Digital Pins: D12/D13 (Water Level), D10 (Water Temp), D11 (Air Temp/Humidity) |           |
|  - Human-Machine Interface: 16x2 LCD via I2C (0x27) on A4/A5                      |           |
|  - Calibration Interface: 4x4 Matrix Keypad (Pins 2 to 9)                         |           |
|  - Inter-IC Telemetry Engine: SoftwareSerial (RX: A1, TX: A2)                     |           |
+------------------------------------+----------------------------------------------+           |
                                     |                                                          |
                                     | UART Serial Data (9600 Baud, Delimited CSV)              |
                                     | Protocol: "D:pH,WL,WT,RT,Hum,TDS,EC\n"                   |
                                     v                                                          |
+-----------------------------------------------------------------------------------+           |
|                       ESP32-S3-N16R8 CAM (GATEWAY & PLANT VISION)                 |           |
|                                                                                   |<----------+
|  - Dual-Core Xtensa LX7 @ 240 MHz, 16 MB Flash, 8 MB Octal PSRAM                  |
|  - Analog Input: GPIO 2 / Pin G2 (ADC1_CH1, 12-Bit Resolution, 3.3V Native)       |
|  - Hardware UART: RX0 (GPIO 44) & TX0 (GPIO 43)                                   |
|  - Optical Sensor: OV2640 Image Sensor (800x600 SVGA, Base64 JPEG Engine)         |
|  - Network Subsystem: 2.4 GHz 802.11 b/g/n Wi-Fi with TLS 1.3 Client              |
|  - Ingestion Loop: Telemetry dispatch every 5 seconds; auto-capture every 30 mins |
+------------------------------------+----------------------------------------------+
                                     |
                                     | HTTPS REST (TLS 1.3, JSON Payloads)
                                     v
+---------------------------------------------------------------------------------------------------------+
|                                    VERCEL SERVERLESS CLOUD LAYER                                        |
|                                                                                                         |
|   POST /api/sensors/data       POST /api/camera/upload       GET /api/sensors/latest                    |
|   GET  /api/sensors/history    POST /api/camera/trigger      GET /api/camera/history                    |
+------------------------------------+----------------------------------+---------------------------------+
                                     |                                  ^
                                     | Read / Write Transactions        | Query Data
                                     v                                  |
+------------------------------------+----------------------------------+---------------------------------+
|                                    MONGODB ATLAS CLUSTER (NO-SQL)                                       |
|                                                                                                         |
|   Database: hydrocore                                                                                   |
|   - sensor_logs         (Real-time telemetry time-series)                                               |
|   - camera_snapshots    (Base64-encoded JPEG image history)                                             |
|   - thresholds          (Safe operational min/max parameters)                                          |
|   - pending_commands    (Asynchronous capture triggers)                                                 |
+------------------------------------+--------------------------------------------------------------------+
                                     |
                                     | Real-time HTTP Polling (5-second intervals)
                                     v
+---------------------------------------------------------------------------------------------------------+
|                                     CLIENT DASHBOARD (REACT 18 SPA)                                     |
|                                                                                                         |
|   - 7 Metric Status Cards (Real-time telemetry with threshold indicators)                               |
|   - Visual Plant Vision Center (Latest snapshot + 48-hour growth timelapse viewer)                      |
|   - Dynamic Recharts Historical Analytics (1h, 2h, 5h, 10h, 20h, All-Time filters)                      |
|   - Comprehensive Data Export to Excel (.xlsx) via SheetJS                                              |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Hardware Specifications & Complete Pinout Table

### 2.1 Microcontroller Units

1. **Arduino Uno R3 (Master Sensor Node):**
   - Microchip ATmega328P 8-bit AVR RISC microcontroller.
   - Operating Voltage: 5.0 V.
   - Clock Frequency: 16 MHz.
   - Role: Real-time sampling of environmental sensors, running the physical keypad and LCD state machine, and serving as a fail-safe hardware monitor.

2. **ESP32-S3-N16R8 CAM (Master Gateway & Computer Vision):**
   - Espressif ESP32-S3 Dual-Core 32-bit Xtensa LX7 processor running at 240 MHz.
   - Memory: 16 MB Quad SPI Flash, 8 MB Octal PSRAM.
   - Operating Voltage: 3.3 V (Board powered via 5V Type-C connector).
   - Integrated Peripherals: OV2640 2-Megapixel Camera, Wi-Fi 802.11 b/g/n, Bluetooth 5.0 LE.
   - Role: Edge-based analog TDS analysis, base64 image compression, bi-directional cloud telemetry ingestion, and remote trigger execution.

### 2.2 Complete Interconnect Matrix

| Sensor / Module | Signal Line | Microcontroller Pin | Voltage Rail | Description & Protocol |
|---|---|---|---|---|
| **pH Sensor** | Analog Output (Po) | Arduino Uno **`A0`** | 5.0 V | Analog voltage signal (2.50 V = pH 7.00). |
| | VCC / GND | Arduino **`5V / GND`** | 5.0 V | Constant 5V supply. |
| **Ultrasonic HC-SR04** | Trigger (TRIG) | Arduino Uno **`D12`** | 5.0 V | 10 µs pulse initiator. |
| | Echo (ECHO) | Arduino Uno **`D13`** | 5.0 V | High-pulse duration denotes distance. |
| | VCC / GND | Arduino **`5V / GND`** | 5.0 V | Regulated power rails. |
| **Water Temp (DS18B20)** | Data (DQ) | Arduino Uno **`D10`** | 5.0 V | Maxim 1-Wire protocol (requires 4.7 kΩ pull-up to 5V). |
| | VCC / GND | Arduino **`5V / GND`** | 5.0 V | Stainless steel waterproof probe assembly. |
| **Room Temp/Hum (DHT11)**| Data Out | Arduino Uno **`D11`** | 5.0 V | Proprietary single-wire bidirectional serial bus. |
| | VCC / GND | Arduino **`5V / GND`** | 5.0 V | Standard 5V excitation. |
| **16x2 Character LCD** | SDA (Data) | Arduino Uno **`A4`** | 5.0 V | I2C bus communication at address `0x27`. |
| | SCL (Clock) | Arduino Uno **`A5`** | 5.0 V | I2C synchronization clock. |
| | VCC / GND | Arduino **`5V / GND`** | 5.0 V | Powers display driver and LED backlight. |
| **4x4 Matrix Keypad** | Row Lines (R1-R4) | Arduino **`D9, D8, D7, D6`** | 5.0 V | Internal pull-up scanned inputs. |
| | Column Lines (C1-C4)| Arduino **`D5, D4, D3, D2`** | 5.0 V | Active low scanning outputs. |
| **Inter-Board UART Link**| Arduino Software TX | ESP32-S3 **`RX0 (GPIO 44)`** | 3.3 V Logic | Transmits telemetry string from Arduino Pin `A2`. |
| | Arduino Software RX | ESP32-S3 **`TX0 (GPIO 43)`** | 3.3 V Logic | Receives synchronization flags on Arduino Pin `A1`. |
| | **Common Ground** | **Arduino GND <-> ESP32 GND** | Ground | **Mandatory:** Zero-potential voltage reference link. |
| **TDS / EC Sensor** | Analog Voltage (Vout) | ESP32-S3 **`G2 (GPIO 2)`** | 3.3 V Native | **ADC1_CH1** high-precision 12-bit analog channel. |
| | VCC (Power) | ESP32-S3 **`3V3`** | 3.3 V | **Caution:** Must not be connected to 5V rail. |
| | GND | ESP32-S3 **`GND`** | Ground | Dedicated analog signal ground. |
| **OV2640 Camera Module** | 8-Bit Bus & Controls | ESP32-S3 Dedicated Flex Bus | 3.3 V / 1.8 V | Uses pins `G4` through `G18` on board. |

---

## 3. Communication Protocols and Mathematical Formulations

### 3.1 Inter-Microcontroller UART Protocol
The Arduino Uno dispatches an ASCII comma-separated values (CSV) frame across SoftwareSerial at **9600 baud** every 1,500 milliseconds:

```
Packet Structure: D:<pH>,<WL>,<WT>,<RT>,<Hum>,<TDS>,<EC>\n
Example Payload:  D:6.2,45.3,24.1,28.0,65.0,780,1.56\n
```

### 3.2 Total Dissolved Solids (TDS) and Electrical Conductivity (EC)
TDS reading utilizes 30-sample sliding average filtering combined with standard temperature compensation:

```
V_raw = (sum(analogRead(GPIO 2)) / 30.0) * (3.3 / 4095.0)
V_compensated = V_raw / (1.0 + 0.02 * (T_water - 25.0))
TDS (ppm) = (133.42 * V_comp^3 - 255.86 * V_comp^2 + 857.39 * V_comp) * 0.5
EC (mS/cm) = TDS / 500.0
```

---

## 4. Software Architecture and Cloud Infrastructure

### 4.1 Technology Stack

| Layer | Framework / Technology | Version | Purpose |
|---|---|---|---|
| **Client UI** | **React.js** | `18.3.1` | Declarative component hierarchy and reactivity. |
| **Build System** | **Vite** | `5.4.8` | Modern ES-module based bundling with near-instantaneous HMR. |
| **CSS Styling** | **Tailwind CSS** | `3.4.13` | Utility-first responsive design, supporting Dark/Light palettes. |
| **Charts** | **Recharts** | `2.12.7` | SVG-based responsive data visualization (Area/Line trends). |
| **Icons** | **Lucide React** | `0.447.0` | Vector icon set for physical interface elements. |
| **Export Engine** | **SheetJS (xlsx)** | `0.18.5` | In-browser binary spreadsheet compilation. |
| **HTTP Layer** | **Axios** | `1.7.7` | Promise-based asynchronous HTTP client. |
| **Serverless Backend**| **Node.js on Vercel** | `20.x` | Stateless edge functions handling REST ingestion and querying. |
| **Database Engine** | **MongoDB Atlas** | `7.0` | Distributed NoSQL multi-region document store. |
| **Database Driver** | **MongoDB Node Driver** | `6.8.0` | High-efficiency native connection pooling and cursor streaming. |
| **Firmware Toolchain**| **Arduino Core for ESP32** | `3.x` | C++ firmware compilation for dual-core Xtensa architecture. |

---

## 5. Cloud Database Schema (MongoDB Atlas: `hydrocore`)

### 5.1 Collection: `sensor_logs`
Stores time-indexed records of all system telemetry.
```json
{
  "_id": { "$oid": "66db8f90246a4e320f781abc" },
  "ph": 6.2,
  "waterLevel": 45.3,
  "waterTemp": 23.8,
  "airTemp": 27.4,
  "humidity": 68.0,
  "tds": 780,
  "ec": 1.56,
  "source": "esp32-s3-gateway",
  "timestamp": { "$date": "2026-09-07T11:45:00.000Z" }
}
```

### 5.2 Collection: `camera_snapshots`
Stores JPEG image snapshots in base64 format directly inside the document store, completely eliminating third-party storage dependencies.
```json
{
  "_id": { "$oid": "66db8fa5246a4e320f781abd" },
  "trigger": "auto_30min",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "timestamp": { "$date": "2026-09-07T11:45:15.000Z" }
}
```

### 5.3 Collection: `thresholds`
Defines operational envelope boundaries for safety alert triggering.
```json
{
  "_id": { "$oid": "default_thresholds" },
  "ph": { "min": 5.5, "max": 6.5 },
  "tds": { "min": 560, "max": 840 },
  "ec": { "min": 1.1, "max": 1.7 },
  "waterLevel": { "min": 20, "max": 80 },
  "waterTemp": { "min": 18, "max": 26 },
  "airTemp": { "min": 20, "max": 30 },
  "humidity": { "min": 50, "max": 75 },
  "updatedAt": { "$date": "2026-09-07T10:00:00.000Z" }
}
```

### 5.4 Collection: `pending_commands`
Serves as an asynchronous message queue between the web dashboard and the physical camera module.
```json
{
  "_id": "camera_trigger",
  "requested": true,
  "requestedAt": { "$date": "2026-09-07T11:44:50.000Z" }
}
```

---

## 6. Cloud REST API Specification

### Endpoints Matrix

| Endpoint | Method | Input Payload | Response Description |
|---|---|---|---|
| `/api/sensors/data` | `POST` | `{"ph":6.2, "tds":780, ...}` | Ingests sensor readings; returns `captureRequested` boolean flag to edge. |
| `/api/sensors/latest` | `GET` | None | Returns the most recent sensor reading document for dashboard display. |
| `/api/sensors/history` | `GET` | URL query parameter `?range=1h\|2h\|5h\|10h\|20h\|all` | Returns chronologically sorted array of telemetry points for Recharts. |
| `/api/sensors/thresholds` | `GET / POST`| Threshold document payload on `POST` | Fetches or persists user-configured operational bounds. |
| `/api/camera/upload` | `POST` | `{"trigger": "...", "image": "data:image/jpeg;base64,..."}` | Persists image snapshot into `camera_snapshots` collection. |
| `/api/camera/latest` | `GET` | None | Fetches newest available plant vision snapshot. |
| `/api/camera/history` | `GET` | None | Fetches all snapshots captured over the preceding 48 hours for timelapse view. |
| `/api/camera/trigger` | `POST` | None | Sets asynchronous capture trigger flag in `pending_commands`. |

---

## 7. Deployment & Flashing Instructions

### 7.1 ESP32-S3-N16R8 CAM Flashing Procedure
1. Launch **Arduino IDE 2.x**.
2. Navigate to **Tools > Board > esp32 > ESP32S3 Dev Module**.
3. Configure the following board settings:
   - **USB CDC On Boot:** `Enabled`
   - **CPU Frequency:** `240MHz (WiFi)`
   - **Flash Size:** `16MB (128Mb)`
   - **Partition Scheme:** `Huge APP (3MB No OTA/1MB SPIFFS)`
   - **PSRAM:** `OPI PSRAM`
4. Connect the USB Type-C cable to the **TTL Port** (CH340 USB-to-UART bridge controller).
5. Open `firmware/esp32_s3_gateway.ino` and click **Upload**.

### 7.2 Arduino Uno Master Flashing Procedure
1. Select **Tools > Board > Arduino AVR Boards > Arduino Uno**.
2. Select the corresponding serial communication port.
3. Open `firmware/arduino_uno_master.ino` and click **Upload**.

---

## 8. Conclusion

The **NutriFlow** IoT platform demonstrates an optimal balance between edge hardware specialization and cloud elasticity. By utilizing dedicated microcontrollers for specialized operations—deterministic hardware polling on the Arduino Uno and high-throughput networking and optical imaging on the ESP32-S3—the system eliminates concurrency contention and hardware brownouts, providing an industrial-grade, maintenance-free automated hydroponics control system.
