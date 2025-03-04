import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./utils/firebaseConfig";
import { ActivityIndicator, View } from "react-native";
import { User } from "firebase/auth";

// Custom hook to protect routes based on authentication state
function useProtectedRoute(user: User | null) {
	const segments = useSegments();
	const router = useRouter();
	const initialRenderRef = useRef(true);

	useEffect(() => {
		// Skip the first render to avoid navigation before layout mounts
		if (initialRenderRef.current) {
			initialRenderRef.current = false;
			return;
		}

		// Check if the first segment is "tabs" (protected area)
		const inTabsGroup = segments[0] === "(tabs)";
		const inLoginScreen = segments[0] === "login";

		// Perform the navigation in the next event loop tick
		// to ensure the component is fully mounted
		const timer = setTimeout(() => {
			if (!user && inTabsGroup) {
				// If there's no user but we're in the protected area, redirect to login
				router.replace("/login");
			} else if (user && inLoginScreen) {
				// If there is a user and we're in the login page, redirect to home
				router.replace("/(tabs)");
			}
		}, 0);

		return () => clearTimeout(timer);
	}, [user, segments]);
}

export default function RootLayout() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Subscribe to Firebase auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setIsLoading(false);
		});

		return unsubscribe;
	}, []);

	// Use our protected route hook
	useProtectedRoute(user);

	// Show loading indicator while checking auth state
	if (isLoading) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" color="#EC9595" />
			</View>
		);
	}

	return (
		<>
			<StatusBar style="dark" />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="login" options={{ headerShown: false }} />
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
			</Stack>
		</>
	);
}
