import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Image,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	SafeAreaView,
	Alert,
	LogBox,
	TextInput
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	fetchRecommendations,
	RecommendationResponse,
	Product,
} from "@/services/suggestions-api";
import { useData } from "./dataContext";

LogBox.ignoreLogs(['new NativeEventEmitter']);
const CACHE_EXPIRATION = 20 * 60 * 1000;

export default function SuggestionsScreen() {
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const { receivedData, setReceivedData } = useData();
	const [recommendations, setRecommendations] =
		useState<RecommendationResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showFullAdvice, setShowFullAdvice] = useState(false);
	const mapPHToDefaultSymptoms = (ph: number) => {
		if (ph < 5.0) {
			return ["itchiness", "dryness", "flakiness"];
		} else if (ph >= 5.0 && ph < 5.5) {
			return ["dryness", "sensitivity"];
		} else if (ph >= 5.5 && ph < 6.0) {
			return ["mild dandruff", "irritation"];
		} else if (ph >= 6.0 && ph < 6.5) {
			return ["dandruff", "itchiness", "oily scalp"];
		} else if (ph >= 6.5 && ph < 7.0) {
			return ["excess oil", "redness", "inflammation"];
		} else if (ph >= 7.0) {
			return ["excess oil", "severe dandruff", "scalp acne", "fungal infection"];
		}
		return [];
	};
		
	const mockUserData = {
		scalpPh: 4.2,
		symptoms: ["dandruff", "itchiness", "dryness"],
	};
	const [symptoms, setSymptoms] = useState<string[]>([]);

	const roundPh = (ph: number) => Math.round(ph * 2) / 2;

	const loadRecommendations = async (refresh = false) => {
		if (refresh) {
			setRefreshing(true);
			const CACHE_KEY = `recommendations_cache_${receivedData}`;
			await AsyncStorage.removeItem(CACHE_KEY);
		} else {
			setLoading(true);
		}

		setError(null);

		try {
			const roundedPh = (parseFloat(receivedData) || 0);
			const CACHE_KEY = `recommendations_cache_${roundedPh}`;

			const cachedData = await AsyncStorage.getItem(CACHE_KEY);
			if (cachedData && symptoms.length === 0) {
				const { data, timestamp } = JSON.parse(cachedData);
				if (Date.now() - timestamp < CACHE_EXPIRATION) {
					setRecommendations(data);
					setLoading(false);
					setRefreshing(false);
					return;
				}
			}

			const data = await fetchRecommendations(
				roundedPh,
				symptoms.length > 0 ? symptoms : mapPHToDefaultSymptoms(roundedPh)
			);

			setRecommendations(data);
			// console.log("Recommendations fetched:", data);
			await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));

		} catch (err) {
			setError("Failed to fetch recommendations. Please try again later.");
			console.error("Error fetching recommendations:", err);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};


	// Fetch recommendations when component mounts
	useEffect(() => {
		loadRecommendations();
	}, []);

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		setSymptoms([]); 
		await loadRecommendations(true);
	};

	// Render loading state
	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#EC9595" />
				<Text style={styles.loadingText}>Loading recommendations...</Text>
			</View>
		);
	}

	// Render error state
	if (error) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>{error}</Text>
				<TouchableOpacity
					style={styles.retryButton}
					onPress={() => loadRecommendations()}
				>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{/* pH Info */}
				<View style={styles.phInfoContainer}>
					<Text style={styles.phInfoText}>
						Your Scalp pH:{" "}
						<Text style={styles.phValue}>
							{recommendations?.scalp_ph.toFixed(1)}
						</Text>
					</Text>
					{recommendations?.symptoms && recommendations.symptoms.length > 0 && (
						<Text style={styles.symptomsText}>
							Symptoms: {recommendations.symptoms.join(", ")}
						</Text>
					)}
				</View>
				{/* Add Symptoms Input */}
				<View style={styles.adviceContainer}>
					<Text style={styles.adviceText}>Enter Symptoms for more accurate suggestions:</Text>
					<TextInput
						style={styles.textInput}
						placeholder="Enter symptoms separated by commas (eg. dandruff, itchiness)"
						onChangeText={(text) => setSymptoms(text.split(",").map(s => s.trim()))}
						onSubmitEditing={() => loadRecommendations(true)}
						returnKeyType="done"
					/>
				</View>
				{/* Expert Advice Section */}
				<View style={styles.adviceContainer}>
					<Text style={styles.sectionTitle}>Expert Advice</Text>
					{recommendations?.advice_text && (
						<>
							<Text style={styles.adviceText} numberOfLines={showFullAdvice ? undefined : 10}>
								{recommendations.advice_text}
							</Text>
							<TouchableOpacity onPress={() => setShowFullAdvice(!showFullAdvice)}>
								<Text style={styles.readMoreText}>
									{showFullAdvice ? "Read Less" : "Read More"}
								</Text>
							</TouchableOpacity>
						</>
					)}
				</View>

				{/* Product Recommendations */}
				<Text style={styles.sectionTitle}>Recommended Products</Text>

				{recommendations?.recommended_products.map((product, id) => (
					<ProductCard
						key={id}
						product={product}
						onPress={() => {}}
					/>
				))}
			</ScrollView>
		</SafeAreaView>
	);
}

// Product Card Component
function ProductCard({
	product,
	onPress,
}: {
	product: Product;
	onPress: () => void;
}) {
	// Helper function to safely format numbers
	const formatNumber = (value: any): string => {
		// If value is a valid number
		if (typeof value === "number" && !isNaN(value)) {
			return value.toFixed(1);
		}
		// If value is a string that can be converted to a number
		else if (typeof value === "string" && !isNaN(parseFloat(value))) {
			return parseFloat(value).toFixed(1);
		}
		// Default case
		return String(value || "");
	};

	return (
		<TouchableOpacity style={styles.productCard} onPress={onPress}>
			<View style={styles.productHeader}>
				<View style={styles.productBasicInfo}>
					<Text style={styles.productName}>{product.name}</Text>
					<Text style={styles.productBrand}>by {product.brand}</Text>
				</View>
				<View
					style={[
						styles.suitabilityBadge,
						product.suitability.includes("Excellent")
							? styles.excellentMatch
							: product.suitability.includes("Very good")
							? styles.veryGoodMatch
							: product.suitability.includes("Good")
							? styles.goodMatch
							: styles.moderateMatch,
					]}
				>
					<Text style={styles.suitabilityText}>{product.suitability}</Text>
				</View>
			</View>

			<View style={styles.productDetails}>
				<View style={styles.productImageContainer}>
					{product.image_url ? (
						<Image
							source={{ uri: product.image_url }}
							style={styles.productImage}
							resizeMode="contain"
						/>
					) : (
						<View style={styles.placeholderImage}>
							<Text style={styles.placeholderText}>No Image</Text>
						</View>
					)}
				</View>

				<View style={styles.productInfo}>
					<Text style={styles.productCategory}>{product.category}</Text>
					<Text style={styles.productPH}>
						pH: {formatNumber(product.ph_level)}
						<Text style={styles.phDifference}>
							{" "}
							(Difference: {formatNumber(product.ph_difference)})
						</Text>
					</Text>

					{product.rating && (
						<Text style={styles.productRating}>
							Rating: {formatNumber(product.rating)} ★
						</Text>
					)}

					{product.price && (
						<Text style={styles.productPrice}>Price: {product.price}</Text>
					)}

				</View>
			</View>

			<Text style={styles.productDescription}>{product.description}</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#E7E7E7",
	},
	scrollView: {
		flex: 1,
		padding: 15,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#E7E7E7",
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: "#333",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#E7E7E7",
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: "#d32f2f",
		textAlign: "center",
		marginBottom: 20,
	},
	retryButton: {
		backgroundColor: "#EC9595",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
	},
	retryButtonText: {
		color: "white",
		fontSize: 16,
	},
	adviceContainer: {
		backgroundColor: "white",
		borderRadius: 10,
		padding: 15,
		marginBottom: 20,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "600",
		marginBottom: 10,
		color: "#333",
	},
	adviceText: {
		fontSize: 16,
		lineHeight: 24,
		color: "#444",
	},
	phInfoContainer: {
		backgroundColor: "#fce4ec",
		borderRadius: 10,
		padding: 15,
		marginBottom: 20,
	},
	phInfoText: {
		fontSize: 16,
		marginBottom: 5,
		color: "#333",
	},
	phValue: {
		fontWeight: "bold",
		color: "#EC9595",
	},
	symptomsText: {
		fontSize: 16,
		color: "#333",
		fontStyle: "italic",
	},
	productCard: {
		backgroundColor: "white",
		borderRadius: 10,
		padding: 15,
		marginBottom: 15,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
	},
	productHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 10,
	},
	productBasicInfo: {
		flex: 1,
	},
	productName: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
	},
	productBrand: {
		fontSize: 14,
		color: "#666",
		marginBottom: 5,
	},
	suitabilityBadge: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 15,
		marginLeft: 5,
	},
	excellentMatch: {
		backgroundColor: "#4caf50",
	},
	veryGoodMatch: {
		backgroundColor: "#8bc34a",
	},
	goodMatch: {
		backgroundColor: "#ffc107",
	},
	moderateMatch: {
		backgroundColor: "#ff9800",
	},
	suitabilityText: {
		color: "white",
		fontSize: 12,
		fontWeight: "600",
	},
	productDetails: {
		flexDirection: "row",
		marginBottom: 10,
	},
	productImageContainer: {
		width: 80,
		height: 80,
		marginRight: 15,
	},
	productImage: {
		width: "100%",
		height: "100%",
		borderRadius: 5,
	},
	placeholderImage: {
		width: "100%",
		height: "100%",
		backgroundColor: "#f0f0f0",
		borderRadius: 5,
		justifyContent: "center",
		alignItems: "center",
	},
	placeholderText: {
		color: "#999",
		fontSize: 12,
	},
	productInfo: {
		flex: 1,
		justifyContent: "center",
	},
	productCategory: {
		fontSize: 14,
		color: "#666",
		marginBottom: 3,
	},
	productPH: {
		fontSize: 14,
		color: "#333",
		marginBottom: 3,
	},
	phDifference: {
		fontSize: 12,
		color: "#666",
	},
	productRating: {
		fontSize: 14,
		color: "#333",
		marginBottom: 3,
	},
	productPrice: {
		fontSize: 14,
		color: "#333",
		marginBottom: 3,
	},
	productSource: {
		fontSize: 12,
		color: "#666",
		fontStyle: "italic",
	},
	productDescription: {
		fontSize: 14,
		lineHeight: 20,
		color: "#444",
		marginTop: 5,
	},
	readMoreText: {
		color: "#EC9595",
		fontSize: 14,
		fontWeight: "600",
		marginTop: 5,
	},
	textInput: {
		height: 40,
		borderColor: "lightgrey",
		borderWidth: 1,
		marginTop: 15,
		marginBottom: 10,
		padding: 10,
		fontSize: 12,
		borderRadius: 10,
	},
});
