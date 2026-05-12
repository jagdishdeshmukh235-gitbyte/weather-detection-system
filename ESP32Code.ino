#define BLYNK_TEMPLATE_ID "TMPL3bkaAmKr4"
#define BLYNK_TEMPLATE_NAME "weather Detection"
#define BLYNK_AUTH_TOKEN "-MzVs7pL7D1CL_HnBRs9oj-5mM2HGmh4"

#include <BlynkSimpleEsp32.h>
#include <DHT.h>
#include <WebServer.h>
#include <WiFi.h>

// WiFi Credentials
char ssid[] = "ESP32";
char pass[] = "12345678";

// DHT Setup
#define DHTPIN 4
#define DHTTYPE DHT22

// Sensor Pins
#define SOIL_PIN 35
#define RAIN_PIN 34
#define LDR_PIN 32

DHT dht(DHTPIN, DHTTYPE);

BlynkTimer timer;

// Web Server
WebServer server(80);

// Global Variables
float temperature;
float humidity;
int soilValue;
int rainValue;
int ldrValue;

// Handle Dashboard API
void handleData() {

  String json = "{";
  json += "\"temperature\":" +
          (isnan(temperature) ? String("null") : String(temperature)) + ",";
  json +=
      "\"humidity\":" + (isnan(humidity) ? String("null") : String(humidity)) +
      ",";
  json += "\"soil\":" + String(soilValue) + ",";
  json += "\"rain\":" + String(rainValue) + ",";
  json += "\"light\":" + String(ldrValue);

  json += "}";

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

// Read Sensors + Send Blynk
void sendSensorData() {

  // Read Sensors
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();

  soilValue = analogRead(SOIL_PIN);
  rainValue = analogRead(RAIN_PIN);
  ldrValue = analogRead(LDR_PIN);

  // Serial Monitor
  Serial.println("------ Sensor Data ------");

  Serial.print("Temperature: ");
  Serial.println(temperature);

  Serial.print("Humidity: ");
  Serial.println(humidity);

  Serial.print("Rain Value: ");
  Serial.println(rainValue);

  Serial.print("Soil Value: ");
  Serial.println(soilValue);

  Serial.print("LDR Value: ");
  Serial.println(ldrValue);

  Serial.println("-------------------------");

  // Send to Blynk
  Blynk.virtualWrite(V0, temperature);
  Blynk.virtualWrite(V1, humidity);
  Blynk.virtualWrite(V2, rainValue);
  Blynk.virtualWrite(V3, soilValue);
  Blynk.virtualWrite(V4, ldrValue);
}

void setup() {

  Serial.begin(115200);

  dht.begin();

  pinMode(RAIN_PIN, INPUT);
  pinMode(SOIL_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);

  // Connect WiFi + Blynk
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  // Print ESP32 IP
  Serial.println(WiFi.localIP());

  // Dashboard API
  server.on("/data", handleData);

  // Start Server
  server.begin();

  Serial.println("Web Server Started");

  // Timer
  timer.setInterval(2000L, sendSensorData);
}

void loop() {

  Blynk.run();

  timer.run();

  server.handleClient();
}