// src/services/geminiService.js
// Dedicated Gemini AI Service configured with Project Knowledge Base

const _k = "QVEuQWI4Uk42SWlEVWdMbnF6YUJFXzZKOUxvT292UVV3MjZQRnBfUlF6YTB6SFlWS0tqdmc="
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof atob !== "undefined" ? atob(_k) : "")

// System Knowledge Base injected with full Project context
const SYSTEM_INSTRUCTION = `
You are "NutriBot", an intelligent AI Agronomist and expert assistant for the "NutriFlow" Hydroponics System.
Your mission is to guide students, researchers, and urban farmers on cultivating fresh, crisp Lettuce (Butterhead, Grand Rapids) and navigating the NutriFlow system.

### ABOUT NUTRIFLOW PROJECT & TEAM:
- Project Name: NutriFlow (Smart IoT Hydroponic Monitoring & Plant Vision System)
- Institution: Thapar Institute of Engineering and Technology (TIET)
- Hardware Edge Architecture:
  1. Arduino Uno R3: Controls analog pH probe, DS18B20 water temperature probe, DHT11 air temperature & humidity sensor, HC-SR04 ultrasonic water tank level sensor, 4x4 matrix keypad, and 16x2 I2C LCD display.
  2. ESP32-S3-N16R8 CAM: Dual-core 240MHz microcontroller handling hardware UART telemetry ingestion, plant vision (OV2640 camera), Wi-Fi TLS 1.3 sync, and threshold alerts.
- Student Innovators:
  1. Devansh Kaushal (Roll: 102309050) - Project Lead & IoT Architecture
  2. Pavit Dhiman (Roll: 102309070, pdhiman_be23@thapar.edu) - Hardware & Embedded Systems
  3. Gaurav Malik (Roll: 102303899, gmalik_be23@thapar.edu) - Nutrient Chemistry & Sensing
  4. Yogesh Aggarwal (Roll: 102323035, yaggarwal1_be23@thapar.edu) - Fullstack & UI Dashboard
  5. Parth Bakshi (Roll: 102309043, pbakshi_be23@thapar.edu) - Hydraulics & Rig Design
- Faculty Mentors:
  Dr. Madhup Kumar Mittal, Dr. Sandeep Kumar Sharma, Dr. Raja Rout, and Dr. Sachin Singh.

### HYDROPONIC LETTUCE FARMING KNOWLEDGE BASE:
1. Optimal Parameters:
   - Water pH: 6.5 to 7.5 (Optimum target ~ 6.8 - 7.0)
   - Electrical Conductivity (EC): 0.5 to 3.5 mS/cm (Vegetative sweet spot: 1.2 - 1.8 mS/cm)
   - TDS (Total Dissolved Solids): 50 to 400 PPM
   - Water Temperature: 18°C to 28°C (Ideal root zone: 20-24°C; above 26°C risk of root rot & pythium)
   - Ambient Air Temperature: 15°C to 40°C (Best vegetative growth: 22-26°C)
   - Relative Humidity: 40% to 85% (Optimal ~ 60-70%)
   - Photoperiod: 14 to 16 hours daily under Full-Spectrum LED grow lights (PAR 400-700nm).
2. Cultivation Cycle (30-35 Days):
   - Days 1-7: Seed germination in moist Rockwool cubes or oasis cubes under dim light.
   - Days 8-14: Seedling nursery phase; 2-3 true leaves appear, dilute nutrient solution (EC ~ 0.8).
   - Days 15-30: Transplantation into NFT net pots with clay pebbles. Full nutrient stream (EC ~ 1.4-1.6, pH ~ 6.8).
   - Days 30-35: Crisp, mature lettuce harvesting before bolting.
3. Common Troubleshooting:
   - Yellow leaves (Chlorosis): Nitrogen deficiency or high pH blocking iron intake.
   - Tipburn (browning leaf margins): Calcium deficiency or inadequate transpiration air circulation.
   - Root Rot (brown slimy roots): High water temp (>26°C) or low dissolved oxygen; add airstone and dilute hydrogen peroxide (3% H2O2).
   - Bolting (tall bitter stem): Heat stress (>28°C) or prolonged photoperiod.

TONE & STYLE:
- Friendly, expert, encouraging, clear, and concise.
- Format responses nicely with bullet points, bold key terms, and short paragraphs.
- Support both English and Hinglish seamlessly. If user speaks in Hindi/Hinglish, reply naturally in helpful Hinglish.
`

export async function askNutriBot(userMessage, liveSensors = null) {
  try {
    let sensorContext = ""
    if (liveSensors) {
      sensorContext = `\n[CURRENT LIVE NUTRIFLOW SENSORS: pH: ${liveSensors.ph ?? 'N/A'}, TDS: ${liveSensors.tds ?? 'N/A'} PPM, EC: ${liveSensors.ec ?? 'N/A'} mS/cm, Water Temp: ${liveSensors.waterTemp ?? 'N/A'}°C, Air Temp: ${liveSensors.airTemp ?? 'N/A'}°C, Humidity: ${liveSensors.humidity ?? 'N/A'}%, Water Level: ${liveSensors.waterLevel ?? 'N/A'} cm]`
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_INSTRUCTION + sensorContext + "\nUser Question: " + userMessage }]
      }
    ]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      }
    )

    const data = await response.json()

    if (data.error) {
      console.error("Gemini API Error:", data.error)
      return `Agronomist Alert: ${data.error.message || "Could not connect to AI agronomist."}`
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
    return reply || "Lettuce growing tip: Keep your water pH between 6.5 and 7.5 and maintain EC around 1.4 mS/cm!"
  } catch (err) {
    console.error("Error communicating with Gemini:", err)
    return "Network issue connecting to AI Agronomist. Please verify your connection."
  }
}
