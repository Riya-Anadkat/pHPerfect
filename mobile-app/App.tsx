import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "./app/context/AuthContext";

// Import screens
import LoginScreen from "./app/login";
import HomeScreen from "./app/(tabs)/index"; // Ensure this exists
import SuggestionsScreen from "./app/(tabs)/suggestions";
import SettingsScreen from "./app/(tabs)/settings";

// Create stack navigators
const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

// Auth navigator (Login Screen)
const AuthNavigator = () => (
	<AuthStack.Navigator screenOptions={{ headerShown: false }}>
		<AuthStack.Screen name="Login" component={LoginScreen} />
	</AuthStack.Navigator>
);

// App navigator (Authenticated users)
const AppNavigator = () => (
	<AppStack.Navigator screenOptions={{ headerShown: false }}>
		<AppStack.Screen name="Home" component={HomeScreen} />
		<AppStack.Screen name="Suggestions" component={SuggestionsScreen} />
		<AppStack.Screen name="Settings" component={SettingsScreen} />
	</AppStack.Navigator>
);

// Root component to handle authentication state
const RootNavigator = () => {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#EC9595" />
			</View>
		);
	}

	return (
		<NavigationContainer>
			{user ? <AppNavigator /> : <AuthNavigator />}
		</NavigationContainer>
	);
};

// Main App component
export default function App() {
	return (
		<AuthProvider>
			<RootNavigator />
		</AuthProvider>
	);
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#E7E7E7",
	},
});
