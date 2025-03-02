// services/api.ts
import { Platform } from "react-native";

// base api url
const LAPTOP_IP = "10.20.98.166"; // Replace with your actual IP

const API_URL =
	Platform.OS === "web"
		? `http://localhost:3001/api`
		: Platform.OS === "android"
		? `http://${LAPTOP_IP}:3001/api`
		: Platform.OS === "ios"
		? `http://${LAPTOP_IP}:3001/api`
		: `http://${LAPTOP_IP}:3001/api`;

// Types
export interface Product {
	id: string;
	name: string;
	brand: string;
	category: string;
	ph_level: number;
	ph_difference: number;
	ingredients?: string;
	image_url?: string;
	rating?: number;
	price?: string;
	source: string;
	suitability: string;
	description: string;
}

export interface RecommendationResponse {
	advice_text: string;
	recommended_products: Product[];
	scalp_ph: number;
	symptoms?: string[];
	error?: string;
}

/**
 * Fetch product recommendations based on user's scalp pH and symptoms
 */
export const fetchRecommendations = async (
	scalpPh: number,
	symptoms: string[] = []
): Promise<RecommendationResponse> => {
	try {
		console.log(`ATTEMPTING TO CONNECT TO BACKEND: ${API_URL}/recommendations`);
		console.log(
			"Request payload:",
			JSON.stringify({
				scalp_ph: scalpPh,
				symptoms: symptoms,
			})
		);

		// First try a simple test to see if the backend is available
		try {
			await fetch(`${API_URL}/test`);
			console.log("Backend server is available");
		} catch (testError) {
			console.error("Backend server test failed:", testError);
		}

		// Always try to use the backend API first
		const response = await fetch(`${API_URL}/recommendations`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				scalp_ph: scalpPh,
				symptoms: symptoms,
			}),
		});

		console.log("BACKEND RESPONSE STATUS:", response.status);

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		const data = await response.json();
		console.log("BACKEND RESPONSE DATA RECEIVED");
		return data;
	} catch (error) {
		console.error("ERROR CONNECTING TO BACKEND:", error);

		// FOR TESTING: Uncomment this line to force the app to always use mock data
		// return getMockRecommendations(scalpPh, symptoms);

		// NORMAL BEHAVIOR: Only fall back to mock data in development
		// if (__DEV__) {
		// 	console.warn("FALLING BACK TO MOCK DATA (development mode)");
		// 	return getMockRecommendations(scalpPh, symptoms);
		// }

		console.log("IT FAILED :(");

		throw error;
	}
};

/**
 * Generate mock recommendations for development testing
 * Only used as fallback if backend is unavailable during development
 */
const getMockRecommendations = (
	scalpPh: number,
	symptoms: string[] = []
): RecommendationResponse => {
	// Adjust advice text based on pH level
	let adviceText = "";

	if (scalpPh < 4.5) {
		adviceText = `Based on your scalp pH of ${scalpPh}, you have a very dry scalp. This can lead to issues like flakiness, irritation, and a compromised skin barrier. Products with a slightly higher pH (around 5.0-5.5) can help gently balance your scalp without stripping natural oils.`;
	} else if (scalpPh > 6.0) {
		adviceText = `Based on your scalp pH of ${scalpPh}, you have an oily scalp. This can contribute to issues like dandruff, itchiness, and greasy hair. Products with a pH closer to 5.5 can help balance your scalp's natural pH and regulate oil production.`;
	} else {
		adviceText = `Based on your scalp pH of ${scalpPh}, your scalp is in a relatively balanced state. To maintain this balance, it's recommended to use products with a similar pH (around 5.0-5.5) to complement your scalp's natural environment.`;
	}

	// Add symptom-specific advice
	if (symptoms.includes("dandruff")) {
		adviceText +=
			" For dandruff specifically, look for products containing active ingredients like zinc pyrithione, ketoconazole, or salicylic acid that target the underlying causes.";
	}

	if (symptoms.includes("itchiness")) {
		adviceText +=
			" To address scalp itchiness, products with soothing ingredients like aloe vera, tea tree oil, or chamomile can provide relief while maintaining pH balance.";
	}

	if (symptoms.includes("dryness")) {
		adviceText +=
			" For scalp dryness, consider adding products with moisturizing ingredients like hyaluronic acid, glycerin, or natural oils to your hair care routine.";
	}

	// Generate mock products with appropriate pH values
	const mockProducts: Product[] = [
		{
			id: "1",
			name: "Tea Tree Special Shampoo",
			brand: "Paul Mitchell",
			category: "Shampoo",
			ph_level: 5.5,
			ph_difference: Math.abs(5.5 - scalpPh),
			ingredients: "Water, Tea Tree Oil, Peppermint, Lavender",
			image_url: "https://via.placeholder.com/100",
			rating: 4.5,
			price: "$22.00",
			source: "Sephora",
			suitability: getMatchCategory(Math.abs(5.5 - scalpPh)),
			description: `This shampoo has a suitable pH level for your scalp pH of ${scalpPh.toFixed(
				1
			)}. With a product pH of 5.5, it can help balance your scalp.`,
		},
		{
			id: "2",
			name: "Anti-Dandruff Shampoo",
			brand: "OUAI",
			category: "Shampoo",
			ph_level: 5.5,
			ph_difference: Math.abs(5.5 - scalpPh),
			ingredients: "Salicylic Acid, Tea Tree Oil, Aloe Vera",
			image_url: "https://via.placeholder.com/100",
			rating: 4.4,
			price: "$38.00",
			source: "Sephora",
			suitability: getMatchCategory(Math.abs(5.5 - scalpPh)),
			description: `This shampoo has a suitable pH level for your scalp pH of ${scalpPh.toFixed(
				1
			)}. With a product pH of 5.5, it can help balance your scalp.`,
		},
		{
			id: "3",
			name: "Scalp Balancing Serum",
			brand: "pHBalance",
			category: "Serum",
			ph_level: 5.2,
			ph_difference: Math.abs(5.2 - scalpPh),
			ingredients: "Water, Glycerin, Niacinamide, Panthenol",
			image_url: "https://via.placeholder.com/100",
			rating: 4.7,
			price: "$38.00",
			source: "OpenBeauty",
			suitability: getMatchCategory(Math.abs(5.2 - scalpPh)),
			description: `This serum can help address your scalp with pH ${scalpPh.toFixed(
				1
			)}. With a product pH of 5.2, it can help restore your scalp's natural balance.`,
		},
		{
			id: "4",
			name: "Clarifying Shampoo",
			brand: "Neutrogena",
			category: "Shampoo",
			ph_level: 5.0,
			ph_difference: Math.abs(5.0 - scalpPh),
			ingredients: "Water, Sodium Laureth Sulfate, Cocamidopropyl Betaine",
			image_url: "https://via.placeholder.com/100",
			rating: 4.2,
			price: "$12.99",
			source: "Open Beauty Facts",
			suitability: getMatchCategory(Math.abs(5.0 - scalpPh)),
			description: `This clarifying shampoo helps remove build-up while maintaining a balanced pH environment for your scalp.`,
		},
		{
			id: "5",
			name: "Hydrating Conditioner",
			brand: "Moroccanoil",
			category: "Conditioner",
			ph_level: 4.5,
			ph_difference: Math.abs(4.5 - scalpPh),
			ingredients: "Water, Argan Oil, Cetearyl Alcohol",
			image_url: "https://via.placeholder.com/100",
			rating: 4.6,
			price: "$26.00",
			source: "Sephora",
			suitability: getMatchCategory(Math.abs(4.5 - scalpPh)),
			description: `This conditioner provides moisture with a slightly acidic pH that can complement your hair care routine.`,
		},
	];

	// Sort by suitability (pH difference)
	mockProducts.sort((a, b) => a.ph_difference - b.ph_difference);

	return {
		advice_text: adviceText,
		recommended_products: mockProducts,
		scalp_ph: scalpPh,
		symptoms: symptoms,
	};
};

/**
 * Helper to determine match category based on pH difference
 */
function getMatchCategory(phDifference: number): string {
	if (phDifference < 0.3) {
		return "Excellent match";
	} else if (phDifference < 0.7) {
		return "Very good match";
	} else if (phDifference < 1.0) {
		return "Good match";
	} else {
		return "Moderate match";
	}
}
