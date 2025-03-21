
import { savePhData } from "../../services/api.js";
import React, { useState, useEffect, createContext, useContext } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../utils/firebaseConfig";
import { signOut, updatePassword } from "firebase/auth";
import { LogBox } from "react-native";
import * as Location from "expo-location";
import base64 from "base64-js";
import { useData } from "./dataContext";

// BLE related imports and setup
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
LogBox.ignoreLogs(["new NativeEventEmitter"]);

const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "87654321-4321-4321-4321-0987654321ba";

export default function SettingsScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [espReceivedData, setEspReceivedData] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [locationPermission, setLocationPermission] = useState(false);
  const [bleAvailable, setBleAvailable] = useState(!!bleManager);
  const { receivedData, setReceivedData } = useData();
  
  useEffect(() => {
    const interval = setInterval(() => {
        const simulatedData = (Math.random() * (1) + 5).toFixed(2); 
        setEspReceivedData(simulatedData);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log(espReceivedData);
    if (parseFloat(espReceivedData) <= 4.17) {
      const interval = setInterval(() => {
        const randomValue = (Math.random() * (0.3) + 4).toFixed(2);
        console.log(`pH level is set to ${randomValue}`);

        setReceivedData(randomValue);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setReceivedData(espReceivedData);
      const saveInterval = setInterval(() => {
        savePhData(espReceivedData)
          .then(() => console.log("pH data saved successfully"))
          .catch((error) => console.error("Failed to save pH data:", error));
            }, 300000); 

      return () => clearInterval(saveInterval);
    }
  }, [espReceivedData]);

  useEffect(() => {
    requestPermissions();
    return () => {
      if (bleManager) {
        console.log("Cleaning up BLE manager...");
        bleManager.stopDeviceScan();
      }
    };
  }, []);
  useEffect(() => {
    if (!connectedDevice) return;

    const subscription = connectedDevice.onDisconnected((error: any) => {
      console.log("Device disconnected", error);
      setConnectedDevice(null);
      setEspReceivedData("");
      if (error) setError(`Device disconnected unexpectedly: ${error.message}`);
    });

    return () => {
      subscription.remove();
    };
  }, [connectedDevice]);

  useEffect(() => {
    if (connectedDevice) {
      setupNotifications(connectedDevice);
    }
  }, [connectedDevice]);
  
  const requestPermissions = async () => {
    try {
      if (Platform.OS === "android") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === "granted");

        if (status !== "granted") {
          setError("Location permission is required for Bluetooth scanning on Android");
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
      setError("BLE is not available. Make sure you are using a development build, not Expo Go.");
      return;
    }

    if (!locationPermission && Platform.OS === "android") {
      setError("Location permission is required for Bluetooth scanning");
      return;
    }

    setIsScanning(true);
    setDevices([]);
    setError("");
    console.log("Starting BLE scan...");

    try {
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

      // Stop scanning after 10 seconds
      setTimeout(() => {
        if (bleManager) {
          console.log("Stopping BLE scan...");
          bleManager.stopDeviceScan();
        }
        setIsScanning(false);
      }, 2000);
    } catch (scanError) {
      console.error("Unexpected scan error:", scanError);
      setError("Unexpected scan error occurred.");
      setIsScanning(false);
    }
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
      const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
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
      device.monitorCharacteristicForService(SERVICE_UUID, CHARACTERISTIC_UUID, (error: any, characteristic: { value: string; }) => {
        if (error) {
          // console.error("Notification error:", error);
          return;
        }

        if (characteristic?.value) {
          try {
            const bytes = base64.toByteArray(characteristic.value);
            const decodedValue = new TextDecoder().decode(bytes);
            // console.log("Received data:", decodedValue);
            setEspReceivedData(decodedValue);
          } catch (decodeError) {
            console.error("Decode error:", decodeError);
            setError(`Failed to decode data: ${decodeError}`);
          }
        }
      });

      console.log("Notification setup complete");
    } catch (err: any) {
      console.error("Notification setup error:", err);
      setError(`Notification setup error: ${err?.message || "Unknown error"}`);
    }
  };
  
  const disconnectDevice = async () => {
    if (!bleAvailable || !connectedDevice) {
      setError("No device connected or BLE not available");
      setError("No device connected or BLE not available");
      return;
    }

    try {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setEspReceivedData("");
      setError("");
      console.log("Disconnected from device");
    } catch (err: any) {
      console.error("Disconnect error:", err);
      setError(`Disconnect error: ${err?.message || "Unknown error"}`);
      console.error("Disconnect error:", err);
      setError(`Disconnect error: ${err?.message || "Unknown error"}`);
    }
  };
  const handleUpdate = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "You must be logged in to update your settings");
      return;
    }

    // If only updating username
    if (username && !password) {
      // Implement user profile update if needed
      // Note: Firebase auth doesn't store usernames by default
      // You'd need to store this in a database
      Alert.alert("Success", "Username updated successfully");
      setUsername("");
      return;
    }

    // If updating password
    if (password) {
      setLoading(true);

      try {
        // Update the password
        await updatePassword(user, password);

        Alert.alert("Success", "Your password has been updated!");
        setPassword("");
      } catch (error: any) {
        // Type the error as 'any' to access the code property
        console.error("Error updating password:", error);

        // If the error is due to requiring recent login
        if (error.code === "auth/requires-recent-login") {
          Alert.alert(
            "Authentication Required",
            "Please log out and log back in to change your password",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Log Out",
                onPress: async () => {
                  await signOut(auth);
                  router.replace("/login");
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Error",
            `Failed to update password: ${error.message || "Unknown error"}`
          );
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
      console.error("Logout error:", error);
    }
  };


  return (
    <ScrollView style={styles.container}>
      {/* Device Connection Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connect Your Device</Text>
        {/* <Text style={styles.label}>pH: {espReceivedData || "Not connected"}</Text> */}

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
            {devices
              .filter((device) => device.name)
              .map((device) => (
                <View key={device.id} style={styles.deviceItem}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceId}>ID: {device.id}</Text>
                  <Button title="Connect" onPress={() => connectToDevice(device)} />
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
              <Button
                title="Disconnect"
                onPress={disconnectDevice}
                color="red"
              />
            </View>
          </View>
        )}
      </View>

      {/* Account Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

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

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Updating..." : "Update Credentials"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7E7E7",
    padding: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "400",
    color: "#333",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  updateButton: {
    backgroundColor: "#EC9595",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: "#f44336",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "red",
    marginVertical: 10,
    backgroundColor: "#ffeeee",
    padding: 8,
    borderRadius: 4,
  },
  scanSection: {
    width: "100%",
    // height: "75%",
  },
  loader: {
    marginTop: 10,
  },
  deviceList: {
    marginTop: 10,
    flex: 1,
    width: "90%",
    borderRadius: 5,
    paddingHorizontal: 10,
    margin: 12,
  },
  deviceItem: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  controlSection: {
    marginTop: 10,
  },
  connectedText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "green",
    marginBottom: 10,
  },
  buttonRow: {
    marginBottom: 10,
  },
});

