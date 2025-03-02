import { Tabs } from "expo-router";

import Ionicons from "@expo/vector-icons/Ionicons";
import { FakeDataProvider } from "./fakeDataContext";

export default function TabLayout() {
  return (
    <FakeDataProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#EC9595",
          headerStyle: {
            backgroundColor: "#E7E7E7",
          },
          headerShadowVisible: false,
          headerTintColor: "#000",
          tabBarStyle: {
            backgroundColor: "#E7E7E7",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "pHPerfect",
            // headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home-sharp" : "home-outline"}
                color={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="suggestions"
          options={{
            title: "Suggestions",
            // headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "bag" : "bag-outline"}
                color={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            // headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cog" : "cog-outline"}
                color={color}
                size={24}
              />
            ),
          }}
        />
      </Tabs>
    </FakeDataProvider>
  );
}
