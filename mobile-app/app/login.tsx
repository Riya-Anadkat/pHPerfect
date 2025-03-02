import React, { useState } from "react";
import {
	Text,
	View,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "./utils/firebaseConfig";
import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	AuthError,
} from "firebase/auth";

export default function LoginScreen() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [isLogin, setIsLogin] = useState(true);

	const handleEmailPasswordAuth = async () => {
		if (!email || !password) {
			Alert.alert("Error", "Please enter both email and password.");
			return;
		}

		console.log("Attempting authentication:", isLogin ? "Login" : "Sign Up");

		setLoading(true);
		try {
			let userCredential;
			if (isLogin) {
				console.log("Logging in...");
				userCredential = await signInWithEmailAndPassword(
					auth,
					email,
					password
				);
			} else {
				console.log("Signing up...");
				userCredential = await createUserWithEmailAndPassword(
					auth,
					email,
					password
				);
			}

			console.log("Authentication successful:", userCredential);
			onLoginSuccess();
		} catch (error) {
			const authError = error as AuthError;
			console.error("Auth Error:", authError.code, authError.message);

			let errorMessage = "Authentication failed.";
			switch (authError.code) {
				case "auth/user-not-found":
				case "auth/wrong-password":
					errorMessage = "Invalid email or password.";
					break;
				case "auth/email-already-in-use":
					errorMessage = "Email is already in use. Please sign in instead.";
					// Automatically switch to login mode if user already exists
					setIsLogin(true);
					break;
				case "auth/invalid-email":
					errorMessage = "Invalid email format.";
					break;
				case "auth/weak-password":
					errorMessage = "Password must be at least 6 characters.";
					break;
				default:
					errorMessage = authError.message;
			}

			Alert.alert("Authentication Error", errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const onLoginSuccess = () => {
		setEmail("");
		setPassword("");
		// Navigate to the tabs screen after successful login
		router.replace("/(tabs)");
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{isLogin ? "Sign In" : "Create Account"}</Text>

			<TextInput
				style={styles.input}
				value={email}
				onChangeText={setEmail}
				placeholder="Enter your email"
				keyboardType="email-address"
				autoCapitalize="none"
			/>

			<TextInput
				style={styles.input}
				value={password}
				onChangeText={setPassword}
				placeholder="Enter your password"
				secureTextEntry
			/>

			<TouchableOpacity
				style={styles.button}
				onPress={handleEmailPasswordAuth}
				disabled={loading}
			>
				{loading ? (
					<ActivityIndicator color="#fff" />
				) : (
					<Text style={styles.buttonText}>
						{isLogin ? "Sign In" : "Sign Up"}
					</Text>
				)}
			</TouchableOpacity>

			<TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
				<Text style={styles.switchText}>
					{isLogin
						? "Don't have an account? Sign Up"
						: "Already have an account? Sign In"}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "#E7E7E7",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
		color: "#333",
	},
	input: {
		height: 50,
		width: "90%",
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		paddingHorizontal: 15,
		marginBottom: 15,
		backgroundColor: "#f9f9f9",
	},
	button: {
		backgroundColor: "#EC9595",
		height: 50,
		width: "90%",
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 10,
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	switchText: {
		textAlign: "center",
		color: "#EC9595",
		marginTop: 15,
		fontWeight: "500",
	},
});
