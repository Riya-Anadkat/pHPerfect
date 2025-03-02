import React, { useState, useEffect, createContext, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
} from "react-native";
import { LogBox } from "react-native";
import * as Location from "expo-location";
import base64 from "base64-js";
import { useFakeData } from "./fakeDataContext";

let BleManager: any;
let bleManager: any;

if (Platform.OS !== "web") {
  try {
    const BleModule = require("react-native-ble-plx");
    BleManager = BleModule.BleManager;
    bleManager = new BleManager();
  } catch (error) {
    console.log("BLE not available:", error);
  }
}

LogBox.ignoreLogs(["new NativeEventEmitter"]);

const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "87654321-4321-4321-4321-0987654321ba";
// export const PhDataContext = createContext<{ receivedData: string, setReceivedData: React.Dispatch<React.SetStateAction<string>> } | null>(null);

export default function SettingsScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [receivedData, setReceivedData] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [locationPermission, setLocationPermission] = useState(false);
  const [bleAvailable, setBleAvailable] = useState(!!bleManager);

  const { fakeReceivedData, setFakeReceivedData } = useFakeData();

  // const navigation = useNavigation();
  // const { receivedData, setReceivedData } = useContext(PhDataContext)!;
  console.log("recieve", receivedData);
  console.log("fakerecieve", fakeReceivedData);
  // console.log("connectedDevice", connectedDevice);

  // setReceivedData("test");

  useEffect(() => {
    console.log(devices);
    requestPermissions();

    return () => {
      if (bleManager) {
        bleManager.destroy();
      }
    };
  }, []);

  useEffect(() => {
    // if (connectedDevice) {
    if (true) {
      setupNotifications(connectedDevice);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        if (count === 15) {
          count = 0;
        }
        setFakeReceivedData(count.toString());
        // readData();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [connectedDevice]);

  const requestPermissions = async () => {
    try {
      if (Platform.OS === "android") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === "granted");

        if (status !== "granted") {
          setError(
            "Location permission is required for Bluetooth scanning on Android"
          );
        }
      } else {
        setLocationPermission(true);
      }
    } catch (err) {
      console.error("Error requesting permissions:", err);
      setError("Failed to request permissions");
    }
  };

  const startScan = () => {
    if (!bleAvailable) {
      setError(
        "BLE is not available. Make sure you are using a development build, not Expo Go."
      );
      return;
    }

    if (!locationPermission && Platform.OS === "android") {
      setError("Location permission is required for Bluetooth scanning");
      return;
    }

    setIsScanning(true);
    setDevices([]);
    setError("");

    bleManager.startDeviceScan(null, null, (error: any, device: any) => {
      if (error) {
        console.error("Scan error:", error);
        setError(`Scan error: ${error.message}`);
        setIsScanning(false);
        return;
      }

      if (device) {
        setDevices((prevDevices) => {
          const deviceExists = prevDevices.some((d) => d.id === device.id);
          if (!deviceExists) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    setTimeout(() => {
      if (bleManager) {
        bleManager.stopDeviceScan();
      }
      setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device: any) => {
    if (!bleAvailable) {
      setError("BLE is not available");
      return;
    }

    try {
      setError("");

      console.log(`Connecting to device: ${device.name || device.id}`);
      const connectedDevice = await device.connect();

      const discoveredDevice =
        await connectedDevice.discoverAllServicesAndCharacteristics();

      setConnectedDevice(discoveredDevice);

      await setupNotifications(discoveredDevice);
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(`Connection error: ${err?.message || "Unknown error"}`);
      setConnectedDevice(null);
    }
  };

  const setupNotifications = async (device: any) => {
    if (!bleAvailable) {
      setError("BLE is not available");
      return;
    }

    try {
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            console.error("Notification error:", error);
            setError(`Notification error: ${error.message}`);
            return;
          }

          if (characteristic?.value) {
            try {
              const bytes = base64.toByteArray(characteristic.value);
              const decodedValue = new TextDecoder().decode(bytes);
              console.log("Received data:", decodedValue);
              // setReceivedData(decodedValue);
            } catch (decodeError) {
              console.error("Decode error:", decodeError);
              setError(`Failed to decode data: ${decodeError}`);
            }
          }
        }
      );

      console.log("Notification setup complete");
    } catch (err: any) {
      console.error("Notification setup error:", err);
      setError(`Notification setup error: ${err?.message || "Unknown error"}`);
    }
  };

  const disconnectDevice = async () => {
    if (!bleAvailable || !connectedDevice) {
      setError("No device connected or BLE not available");
      return;
    }

    try {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setReceivedData("");
      console.log("Disconnected from device");

      setTimeout(() => {
        bleManager.destroy();
      }, 500);
    } catch (err: any) {
      console.error("Disconnect error:", err);
      setError(`Disconnect error: ${err?.message || "Unknown error"}`);
    }
  };

  const readData = async () => {
    // if (!bleAvailable || !connectedDevice) {
    //   setError("No device connected or BLE not available");
    //   console.log("error heere");
    //   return;
    // }

    try {
      const characteristic = await connectedDevice.readCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID
      );

      if (characteristic?.value) {
        try {
          const bytes = base64.toByteArray(characteristic.value);
          const decodedValue = new TextDecoder().decode(bytes);
          console.log("Read data:", decodedValue);
          // setReceivedData(decodedValue);
          setReceivedData("test");
        } catch (decodeError) {
          console.error("Decode error:", decodeError);
          setError(`Failed to decode data: ${decodeError}`);
        }
      }
    } catch (err: any) {
      console.error("Read error:", err);
      setError(`Please reconnect to device`);
    }
  };

  const handleUpdate = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Success", "Your credentials have been updated!");
      setUsername("");
      setPassword("");
    } catch (error) {
      Alert.alert("Error", "Failed to update credentials. Try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Connect your pH hair device</Text>
      <Text style={styles.label}>pH: {receivedData}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!connectedDevice ? (
        <View style={styles.scanSection}>
          <Button
            title={isScanning ? "Scanning..." : "Scan for Devices"}
            onPress={startScan}
            disabled={isScanning || !locationPermission || !bleAvailable}
          />

          {isScanning && <ActivityIndicator style={styles.loader} />}

          <ScrollView style={styles.deviceList}>
            {devices.map((device) => (
              <View key={device.id} style={styles.deviceItem}>
                <Text style={styles.deviceName}>
                  {device.name || "Unnamed Device"}
                </Text>
                <Text style={styles.deviceId}>ID: {device.id}</Text>
                <Button
                  title="Connect"
                  onPress={() => connectToDevice(device)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.controlSection}>
          <Text style={styles.connectedText}>
            Connected to: {connectedDevice.name || connectedDevice.id}
          </Text>

          <View style={styles.buttonRow}>
            <Button title="Disconnect" onPress={disconnectDevice} color="red" />
          </View>
        </View>
      )}
      {/* </View> */}
      <Text style={styles.label}>New Username:</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter new username"
        autoCapitalize="none"
      />

      <Text style={styles.label}>New Password:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter new password"
        secureTextEntry
      />
      <View style={styles.button}>
        <Button
          color="#fff"
          title={loading ? "Updating..." : "Submit"}
          onPress={handleUpdate}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7E7E7",
    alignItems: "flex-start",
    paddingTop: 30,
    padding: 10,
  },
  container2: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
    paddingTop: 40,
  },
  label: {
    fontSize: 16,
    margin: 12,
    fontWeight: "400",
    color: "#000",
  },
  input: {
    height: 50,
    width: "90%",
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    margin: 12,
  },
  button: {
    width: "90%",
    margin: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ccc",
    padding: 10,
    backgroundColor: "#EC9595",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  error: {
    color: "red",
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#ffeeee",
    borderRadius: 4,
  },
  info: {
    color: "#333",
    marginTop: 20,
    padding: 10,
    backgroundColor: "#e6f7ff",
    borderRadius: 4,
    lineHeight: 22,
  },
  scanSection: {
    flex: 1,
  },
  loader: {
    marginTop: 10,
  },
  deviceList: {
    marginTop: 20,
    flex: 1,
  },
  deviceItem: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deviceId: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  controlSection: {
    flex: 1,
  },
  connectedText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "green",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dataDisplay: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  dataContent: {
    flex: 1,
  },
});
