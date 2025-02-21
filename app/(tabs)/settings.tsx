import React, { useState } from "react";
import { Text, View, StyleSheet, TextInput, Button, Alert } from "react-native";

export default function SettingsScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
});
