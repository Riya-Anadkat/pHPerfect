from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback
from dotenv import load_dotenv
from productRecommendations import PHPerfectAPIIntegration

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Enable CORS to allow requests from your React Native app
CORS(app, resources={r"/api/*": {"origins": "*"}}, allow_headers=["*"], allow_methods=["*"])

# Check if API keys are present
openai_key = os.getenv("OPENAI_API_KEY")
sephora_key = os.getenv("SEPHORA_API_KEY")

if not openai_key:
    print("WARNING: OPENAI_API_KEY not found in environment")
if not sephora_key:
    print("WARNING: SEPHORA_API_KEY not found in environment")

# Initialize API integration
try:
    api = PHPerfectAPIIntegration()
    print("Successfully initialized API integration")
except Exception as e:
    print(f"Error initializing API integration: {e}")
    traceback.print_exc()

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({"status": "ok", "message": "API server is running"}), 200

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    try:
        # Get data from request
        data = request.json
        scalp_ph = data.get('scalp_ph', 5.5)  # Default to 5.5 if not provided
        symptoms = data.get('symptoms', [])
        
        print(f"Received request for scalp pH: {scalp_ph}, symptoms: {symptoms}")
        
        # Fetch product recommendations from different sources
        hair_products = []
        
        try:
            # Get shampoos
            print("Fetching shampoo products...")
            hair_products.extend(api.fetch_beauty_products(category="shampoo", count=3))
            
            # Get products based on scalp pH
            query = "scalp care"
            if scalp_ph > 6.0:
                query = "oily scalp"
            elif scalp_ph < 4.5:
                query = "dry scalp"
                
            print(f"Fetching products for '{query}'...")
            hair_products.extend(api.fetch_sephora_products(query=query, count=3))
            
            # Add more targeted products based on symptoms
            if "dandruff" in symptoms:
                print("Fetching dandruff products...")
                hair_products.extend(api.fetch_sephora_products(query="dandruff shampoo", count=2))
            if "dryness" in symptoms:
                print("Fetching dry scalp products...")
                hair_products.extend(api.fetch_sephora_products(query="dry scalp treatment", count=2))
            if "itchiness" in symptoms:
                print("Fetching itchy scalp products...")
                hair_products.extend(api.fetch_sephora_products(query="itchy scalp relief", count=2))
                
            print(f"Successfully fetched {len(hair_products)} products total")
        except Exception as e:
            print(f"Error fetching products: {e}")
            traceback.print_exc()
            # Continue with any products we have or fallback to default products
            if not hair_products:
                print("Using default products due to fetch error")
                hair_products = api._generate_default_products()
            
        # Get recommendations from OpenAI and product list
        print("Getting OpenAI recommendations...")
        recommendations = api.get_openai_recommendation(scalp_ph, symptoms, hair_products)
        
        print("Successfully generated recommendations")
        # Return JSON response
        return jsonify(recommendations)
    
    except Exception as e:
        print(f"Error processing recommendation request: {e}")
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "advice_text": f"Sorry, we encountered an error processing your request: {str(e)}. Please try again later.",
            "recommended_products": api._generate_default_products() if 'api' in locals() else [],
            "scalp_ph": data.get('scalp_ph', 5.5) if 'data' in locals() else 5.5,
            "symptoms": data.get('symptoms', []) if 'data' in locals() else []
        }), 500

if __name__ == "__main__":
    print("Starting Flask server...")
    port = int(os.environ.get("PORT", 3001))
    # Use 0.0.0.0 to allow connections from other devices on the network
    app.run(host="0.0.0.0", port=port, debug=True)