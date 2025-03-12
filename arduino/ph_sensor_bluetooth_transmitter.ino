#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "esp_bt.h"

float calibration_value = 18.96;
#define PH_SENSOR_PIN 34 
#define SERVICE_UUID        "12345678-1234-1234-1234-1234567890ab"
#define CHARACTERISTIC_UUID "87654321-4321-4321-4321-0987654321ba"

BLECharacteristic *pHCharacteristic;
BLEServer *pServer;
bool deviceConnected = false;

// BLE Server Callback to Handle Disconnect
class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        deviceConnected = true;
        Serial.println("Device connected!");
    }

    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        Serial.println("Device disconnected, restarting advertising...");
        BLEDevice::startAdvertising();  // Restart advertising after disconnect
    }
};

void setup() {
  Serial.begin(115200);
  
  analogReadResolution(12);  // Set ADC resolution
  analogSetWidth(12);        // Ensure full 12-bit width
  analogSetAttenuation(ADC_11db);  // Allow full 0-3.3V range

  Serial.println("Releasing classic Bluetooth memory...");
  esp_bt_controller_mem_release(ESP_BT_MODE_CLASSIC_BT);
  
  Serial.println("Starting BLE setup...");
  BLEDevice::init("pHPerfect");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pHCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
                    );
  pHCharacteristic->addDescriptor(new BLE2902());

  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  pAdvertising->setMinInterval(0x20);
  pAdvertising->setMaxInterval(0x40);
  BLEDevice::startAdvertising();
  Serial.println("BLE pH Sensor is now advertising...");
}

void loop() {
  delay(50);  // Stabilization delay before reading ADC
  analogSetAttenuation(ADC_11db);
  analogReadResolution(12); 
  analogSetWidth(12);
  int sensorValue = analogRead(PH_SENSOR_PIN);

  float volt = ((float)sensorValue * 3.3 / 4095) - 0.4; 
  Serial.print("volt: ");
  Serial.println(volt);

  float ph_act = -5.1552 * volt + calibration_value;

  Serial.print("pH = ");
  Serial.println(ph_act, 4);  

  if (deviceConnected) {
    char pHStr[8];
    dtostrf(ph_act, 1, 2, pHStr);
    pHCharacteristic->setValue(pHStr);
    Serial.print("sending data = ");
    Serial.println(pHStr);
    pHCharacteristic->notify();
  }

  delay(1000);
}