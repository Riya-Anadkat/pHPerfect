import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebaseConfig";
import { FakeDataProvider } from "./fakeDataContext";

export default function TabLayout() {
  const router = useRouter();

  // Check authentication status when tabs are loaded
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Redirect to login if not authenticated
        router.replace("/login");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <FakeDataProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#EC9595",
          tabBarInactiveTintColor: "gray",
          headerStyle: {
            backgroundColor: "#f5f5f5",
          },
          headerTitleStyle: {
            fontWeight: "bold",
            color: "#333",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="home" size={24} color={color} />
            ),
            headerTitle: "Your Hair Health",
          }}
        />
        <Tabs.Screen
          name="suggestions"
          options={{
            title: "Suggestions",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="shopping-bag" size={24} color={color} />
            ),
            headerTitle: "Recommended Products",
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-outline" size={24} color={color} />
            ),
            headerTitle: "Account Settings",
          }}
        />
      </Tabs>
    </FakeDataProvider>
  );
}
