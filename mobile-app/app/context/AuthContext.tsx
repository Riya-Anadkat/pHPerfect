import React, {
	createContext,
	useState,
	useContext,
	useEffect,
	ReactNode,
} from "react";
import { User } from "firebase/auth";
import { auth, signOut } from "../utils/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

interface AuthContextType {
	user: User | null;
	loading: boolean;
	logout: () => Promise<void>;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	logout: async () => {},
});

interface AuthProviderProps {
	children: ReactNode;
}

// Create a provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		// Subscribe to auth state changes
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUser(user);
			setLoading(false);
		});

		// Clean up subscription
		return unsubscribe;
	}, []);

	// Logout function
	const logout = async (): Promise<void> => {
		try {
			await signOut(auth);
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	// Context value
	const value: AuthContextType = {
		user,
		loading,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
	return useContext(AuthContext);
};
