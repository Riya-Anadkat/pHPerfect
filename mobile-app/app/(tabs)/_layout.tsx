import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebaseConfig";
import { DataProvider } from "./dataContext";

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
    <DataProvider>
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
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home-sharp" : "home-outline"}
                color={color}
                size={24}
              />
            ),
            headerTitle: "Your Hair Health",
          }}
        />
        <Tabs.Screen
          name="suggestions"
          options={{
            title: "Suggestions",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "bag" : "bag-outline"}
                color={color}
                size={24}
              />
            ),
            headerTitle: "Recommended Products",
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cog" : "cog-outline"}
                color={color}
                size={24}
              />
            ),
            headerTitle: "Account Settings",
          }}
        />
      </Tabs>
    </DataProvider>
  );
}
