import requests
import json
import time
import os
import http.client
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class PHPerfectAPIIntegration:
    """
    Class to handle integration with OpenAI API, Open Beauty Facts API, and Sephora API
    for the pHPerfect product recommendation system
    """
    
    def __init__(self):
        """Initialize with API keys and base URLs"""
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
            
        self.openbeauty_api_url = "https://world.openbeautyfacts.org/api/v0"
        self.sephora_api_key = os.getenv("SEPHORA_API_KEY")
        
        # Product cache to avoid repeated API calls
        self.product_cache = {}
        
    def fetch_beauty_products(self, category=None, count=20):
        """
        Fetch hair products from Open Beauty Facts API
        
        Args:
            category: Product category to filter by (e.g., "shampoo", "conditioner")
            count: Number of products to retrieve
            
        Returns:
            List of product dictionaries
        """
        print(f"Fetching {count} beauty products from Open Beauty Facts API...")
        
        try:
            # Construct search URL based on category
            if category:
                search_url = f"{self.openbeauty_api_url}/search?categories_tags={category}&page_size={count}"
            else:
                search_url = f"{self.openbeauty_api_url}/search?categories_tags=Hair&page_size={count}"
                
            # Make API request
            response = requests.get(search_url)
            response.raise_for_status()
            
            # Parse response
            result = response.json()
            products = result.get('products', [])
            
            if not products:
                print("No products found. Using default product set.")
                return self._generate_default_products(source="OpenBeauty")
                
            # Process products
            processed_products = []
            for product in products:
                # Skip products with missing or "Unknown" names
                product_name = product.get('product_name', '').strip()
                if not product_name or product_name.lower() == 'unknown product':
                    continue
                    
                # Extract relevant information
                processed_product = {
                    'id': product.get('_id', ''),
                    'name': product_name,
                    'brand': product.get('brands', 'Unknown Brand'),
                    'category': product.get('categories_tags', ['unknown'])[0].replace('en:', ''),
                    'ingredients': product.get('ingredients_text', 'Not specified'),
                    'ph_level': self._extract_ph_level(product),
                    'image_url': product.get('image_url', ''),
                    'source': 'OpenBeauty'
                }
                
                processed_products.append(processed_product)
                
            print(f"Successfully fetched {len(processed_products)} products from OpenBeauty")
            return processed_products
            
        except Exception as e:
            print(f"Error fetching products from Open Beauty Facts API: {e}")
            print("Using default product set instead.")
            return self._generate_default_products(source="OpenBeauty")
    
    def fetch_sephora_products(self, query=None, count=10):
        """
        Fetch hair products from Sephora API using search query
        
        Args:
            query: Search query (e.g., "oily scalp", "dry scalp", "dandruff")
            count: Number of products to retrieve
            
        Returns:
            List of product dictionaries
        """
        print(f"Fetching {count} products from Sephora API for query: '{query}'...")
        
        # If no query provided, use a default pH-related query
        if not query:
            query = "scalp care"
            
        try:
            # Format the query for URL
            formatted_query = query.replace(" ", "%20")
            
            # Set up connection
            conn = http.client.HTTPSConnection("sephora.p.rapidapi.com")
            
            # Set headers with API key
            headers = {
                'x-rapidapi-key': self.sephora_api_key,
                'x-rapidapi-host': "sephora.p.rapidapi.com"
            }
            
            # Make the request
            endpoint = f"/us/products/v2/search?q={formatted_query}&pageSize={count}&currentPage=1"
            print(f"Making request to: {endpoint}")
            
            conn.request("GET", endpoint, headers=headers)
            
            # Get response
            res = conn.getresponse()
            data = res.read()
            
            # Get raw response
            raw_response = data.decode("utf-8") if data else None
            
            if not raw_response:
                print("No response data from Sephora API. Using default products.")
                return self._generate_default_products(source="Sephora")
                
            # Parse JSON response
            try:
                response_data = json.loads(raw_response)
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON: {e}")
                return self._generate_default_products(source="Sephora")
            
            # Close connection
            conn.close()
            
            # Extract products array safely
            products_data = []
            if isinstance(response_data, dict):
                if 'products' in response_data and isinstance(response_data['products'], list):
                    products_data = response_data['products']
                elif 'data' in response_data and isinstance(response_data['data'], dict) and 'products' in response_data['data']:
                    products_data = response_data['data']['products']
                elif 'items' in response_data and isinstance(response_data['items'], list):
                    products_data = response_data['items']
                else:
                    # Log available keys for debugging
                    print(f"Unexpected response structure. Keys: {list(response_data.keys())}")
            
            if not products_data:
                print("No products found from Sephora API. Using backup approach...")
                return self._generate_default_products(source="Sephora")
                
            # Process products
            processed_products = []
            
            for product in products_data:
                if not isinstance(product, dict):
                    print(f"Skipping non-dict product: {type(product)}")
                    continue
                
                # Extract basic product info with safer access
                product_id = product.get('productId', product.get('id', ''))
                product_name = product.get('displayName', product.get('name', 'Unknown Product'))
                brand_name = product.get('brandName', product.get('brand', 'Unknown Brand'))
                price = product.get('currentSku', {}).get('listPrice', 'Price not available')
                
                # Extract rating safely
                rating = None
                if 'rating' in product:
                    rating = product.get('rating')
                elif 'reviews' in product:
                    reviews = product.get('reviews', {})
                    if isinstance(reviews, dict):
                        rating = reviews.get('rating')
                
                # Determine category and estimate pH
                category, ph_level = self._categorize_sephora_product(product, query)
                
                # Create processed product entry
                processed_product = {
                    'id': product_id,
                    'name': product_name,
                    'brand': brand_name,
                    'category': category,
                    'ingredients': self._extract_sephora_ingredients(product),
                    'ph_level': ph_level,
                    'image_url': self._extract_image_url(product),
                    'rating': rating,
                    'price': price,
                    'source': 'Sephora'
                }
                
                processed_products.append(processed_product)
                
                # Add a small delay to avoid rate limiting
                time.sleep(0.2)
            
            print(f"Successfully fetched {len(processed_products)} products from Sephora")
            return processed_products
            
        except Exception as e:
            print(f"Error fetching products from Sephora API: {e}")
            print("Using default Sephora product set instead.")
            return self._generate_default_products(source="Sephora")
    
    def _extract_image_url(self, product):
        """Extract image URL safely from product data"""
        # Check for heroImage object
        if 'heroImage' in product and isinstance(product['heroImage'], dict):
            return product['heroImage'].get('imageUrl', '')
        
        # Check for direct imageUrl
        if 'imageUrl' in product:
            return product['imageUrl']
            
        # Check for image field
        if 'image' in product:
            if isinstance(product['image'], dict):
                return product['image'].get('url', '')
            elif isinstance(product['image'], str):
                return product['image']
        
        return ''
    
    def _categorize_sephora_product(self, product, query=None):
        """
        Categorize Sephora product and estimate pH level based on product information
        
        Args:
            product: Product data from Sephora API
            query: Original search query used
            
        Returns:
            Tuple of (category, ph_level)
        """
        # Extract name and attributes for categorization
        product_name = product.get('displayName', '').lower() if isinstance(product.get('displayName'), str) else ''
        product_type = product.get('productType', '').lower() if isinstance(product.get('productType'), str) else ''
        
        # Default pH and category
        category = 'Hair Care'
        ph_level = 5.5
        
        # Categorize based on product name and type
        if 'shampoo' in product_name or 'shampoo' in product_type:
            category = 'Shampoo'
            ph_level = 5.5
        elif 'conditioner' in product_name or 'conditioner' in product_type:
            category = 'Conditioner'
            ph_level = 4.5
        elif 'treatment' in product_name or 'treatment' in product_type:
            category = 'Treatment'
            ph_level = 5.0
        elif 'mask' in product_name or 'mask' in product_type:
            category = 'Mask'
            ph_level = 5.0
        elif 'oil' in product_name or 'oil' in product_type:
            category = 'Oil'
            ph_level = 5.0
        elif 'serum' in product_name or 'serum' in product_type:
            category = 'Serum'
            ph_level = 5.0
        elif 'scalp' in product_name or 'scalp' in product_type:
            category = 'Scalp Care'
            
            # Further refinement for scalp products
            if 'oily' in product_name or 'oily' in product_type:
                ph_level = 5.0
            elif 'dry' in product_name or 'dry' in product_type:
                ph_level = 5.8
            elif 'dandruff' in product_name or 'dandruff' in product_type:
                ph_level = 5.2
        
        # If original query can provide context, use it
        if query:
            query = query.lower()
            if 'oily' in query:
                if category == 'Scalp Care':
                    ph_level = 5.0
            elif 'dry' in query:
                if category == 'Scalp Care':
                    ph_level = 5.8
            elif 'dandruff' in query:
                if category == 'Scalp Care':
                    ph_level = 5.2
                
        return category, ph_level
    
    def _extract_sephora_ingredients(self, product):
        """Extract ingredients from Sephora product if available"""
        # Look for ingredients in different possible fields
        for field in ['ingredients', 'ingredientsList', 'ingredient_list']:
            if field in product and product[field]:
                return product[field]
                
        # Check in description fields
        for field in ['longDescription', 'shortDescription', 'description']:
            if field in product and product[field]:
                desc = product[field]
                if isinstance(desc, str) and ('ingredient' in desc.lower()):
                    return desc
                    
        return "Ingredients not available"
    
    def _extract_ph_level(self, product):
        """Extract pH level from product data or estimate if not available"""
        # Try to find explicit pH information
        if 'ph' in product:
            try:
                return float(product['ph'])
            except (ValueError, TypeError):
                pass
                
        # Look for pH in product name or description
        for field in ['product_name', 'generic_name', 'ingredients_text']:
            if field in product and product[field]:
                ph_match = self._find_ph_in_text(str(product[field]))
                if ph_match is not None:
                    return ph_match
        
        # Estimate pH based on category if still not found
        return self._estimate_ph_by_category(product)
    
    def _find_ph_in_text(self, text):
        """Find pH level mentioned in text"""
        import re
        
        # Look for patterns like "pH 5.5" or "pH balanced (5.5)"
        ph_patterns = [
            r'pH\s*?(\d+\.?\d*)',
            r'pH\s+balance.*?(\d+\.?\d*)',
            r'pH\s+level.*?(\d+\.?\d*)'
        ]
        
        for pattern in ph_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    ph_value = float(match.group(1))
                    if 3 <= ph_value <= 8:  # Validate reasonable pH range
                        return ph_value
                except (ValueError, IndexError):
                    continue
                    
        return None
        
    def _estimate_ph_by_category(self, product):
        """Estimate pH based on product category"""
        # Default pH ranges by category
        category_ph = {
            'shampoo': 5.5,
            'conditioner': 4.5,
            'hair mask': 4.8,
            'treatment': 5.0,
            'oil': 5.0,
            'serum': 5.0,
            'spray': 5.5
        }
        
        # Check product category
        categories = []
        if 'categories' in product and product['categories']:
            categories.append(product['categories'].lower())
            
        if 'categories_tags' in product:
            for tag in product['categories_tags']:
                if isinstance(tag, str):
                    categories.append(tag.lower().replace('en:', ''))
        
        # Find matching category and return pH
        for category in categories:
            for key, ph in category_ph.items():
                if key in category:
                    return ph
                    
        # Default pH if no category matched
        return 5.5  # Average pH for hair products
    
    def _generate_default_products(self, source="Default"):
        """Generate default product set for testing when API fails"""
        default_products = [
            {
                'id': 'default-1',
                'name': 'pH Balanced Shampoo',
                'brand': 'Healthy Hair',
                'category': 'Shampoo',
                'ingredients': 'Water, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Glycerin, Aloe Vera Extract',
                'ph_level': 5.5,
                'image_url': '',
                'rating': 4.5,
                'price': '$24.50',
                'source': source
            },
            {
                'id': 'default-2',
                'name': 'Moisturizing Conditioner',
                'brand': 'Healthy Hair',
                'category': 'Conditioner',
                'ingredients': 'Water, Cetearyl Alcohol, Behentrimonium Chloride, Coconut Oil, Argan Oil',
                'ph_level': 4.5,
                'image_url': '',
                'rating': 4.2,
                'price': '$26.00',
                'source': source
            },
            {
                'id': 'default-3',
                'name': 'Anti-Dandruff Treatment',
                'brand': 'ScalpCare',
                'category': 'Treatment',
                'ingredients': 'Water, Salicylic Acid, Zinc Pyrithione, Tea Tree Oil, Aloe Vera',
                'ph_level': 5.0,
                'image_url': '',
                'rating': 4.0,
                'price': '$32.00',
                'source': source
            },
            {
                'id': 'default-4',
                'name': 'Scalp Balancing Serum',
                'brand': 'pHBalance',
                'category': 'Serum',
                'ingredients': 'Water, Glycerin, Niacinamide, Panthenol, Hyaluronic Acid',
                'ph_level': 5.2,
                'image_url': '',
                'rating': 4.7,
                'price': '$38.00',
                'source': source
            },
            {
                'id': 'default-5',
                'name': 'Clarifying Shampoo',
                'brand': 'CleanScalp',
                'category': 'Shampoo',
                'ingredients': 'Water, Apple Cider Vinegar, Tea Tree Oil, Peppermint Oil',
                'ph_level': 4.8,
                'image_url': '',
                'rating': 4.3,
                'price': '$22.00',
                'source': source
            }
        ]
        
        return default_products
    
    def _determine_suitability(self, ph_difference):
        """Determine product suitability based on pH difference"""
        if ph_difference < 0.3:
            return "Excellent match"
        elif ph_difference < 0.7:
            return "Very good match"
        elif ph_difference < 1.0:
            return "Good match"
        else:
            return "Moderate match"
            
    def _generate_product_description(self, product, scalp_ph):
        """Generate a simple description of why this product is recommended"""
        ph_difference = product['ph_difference']
        
        if scalp_ph < 4.5:
            condition = "dry scalp"
            needs = "moisturize and restore your scalp's natural barrier"
        elif scalp_ph > 6.0:
            condition = "oily scalp"
            needs = "balance oil production and restore optimal pH"
        elif 5.5 <= scalp_ph <= 6.0:
            condition = "slightly oily scalp"
            needs = "gently balance your scalp pH"
        elif 4.5 <= scalp_ph < 5.0:
            condition = "sensitive scalp"
            needs = "soothe sensitivity while restoring pH balance"
        else:  # 5.0 <= scalp_ph < 5.5
            condition = "balanced scalp"
            needs = "maintain your healthy scalp pH"
        
        if ph_difference < 0.3:
            effectiveness = "is an ideal pH match"
        elif ph_difference < 0.7:
            effectiveness = "has a very good pH balance"
        elif ph_difference < 1.0:
            effectiveness = "has a suitable pH level"
        else:
            effectiveness = "can help address"
            
        category = product.get('category', '').lower() 
        if category == 'unknown':
            category = 'product'
        
        # Include rating if available
        rating_info = ""
        if product.get('rating'):
            rating_info = f" It has a rating of {product['rating']} stars."
            
        # Include price if available
        price_info = ""
        if product.get('price') and product['price'] != 'Price not available':
            price_info = f" Available for {product['price']}."
            
        return (
            f"This {category} {effectiveness} for your {condition} "
            f"with pH {scalp_ph:.1f}. With a product pH of {product['ph_level']}, "
            f"it can help {needs}.{rating_info}{price_info}"
        )
    
    def _create_recommendation_prompt(self, scalp_ph, symptoms, products):
        """Create a detailed prompt for OpenAI recommendation generation"""
        # Determine scalp condition based on pH
        if scalp_ph < 4.5:
            condition = "dry and potentially irritated scalp"
        elif scalp_ph > 6.0:
            condition = "oily scalp"
        elif 5.5 <= scalp_ph <= 6.0:
            condition = "slightly oily scalp"
        elif 4.5 <= scalp_ph < 5.0:
            condition = "sensitive scalp"
        else:  # 5.0 <= scalp_ph < 5.5
            condition = "balanced scalp"
            
        # Create base prompt
        prompt = f"""
        The user has a scalp pH of {scalp_ph}, which indicates a {condition}.
        """
        
        # Add symptoms if available
        if symptoms and len(symptoms) > 0:
            prompt += f"\nThey report the following symptoms: {', '.join(symptoms)}."
            
        # Add product information from APIs
        prompt += "\n\nBased on their scalp pH, these are some recommended products we found from our database:"
        
        for i, product in enumerate(products[:3], 1):
            source = product.get('source', 'Unknown')
            rating_info = f" | Rating: {product['rating']} stars" if product.get('rating') else ""
            price_info = f" | Price: {product['price']}" if product.get('price') and product['price'] != 'Price not available' else ""
            
            prompt += f"""
            {i}. {product['name']} by {product['brand']} (pH: {product['ph_level']}) - Source: {source}{rating_info}{price_info}
               Description: {product['category']} with ingredients: {product['ingredients'][:100]}...
            """
            
        # Instruction for response
        prompt += """
        Please provide:
        
        1. A brief explanation of what this scalp pH means for their hair health.
        
        2. A concise overview of why the products from our database are suitable for this pH level and symptoms.
        
        3. General recommendations for hair care routines based on this scalp pH.
        
        4. Tips for effectively using hair products with this scalp pH.
        
        Format your response to be conversational and informative. Do NOT list additional specific product recommendations - we will present our own product list to the user separately.
        """
        
        return prompt

    def get_openai_recommendation(self, scalp_ph, symptoms=None, products=None):
        """
        Get personalized product recommendations using OpenAI API
        
        Args:
            scalp_ph: User's scalp pH measurement
            symptoms: List of symptoms reported by the user
            products: List of product dictionaries to recommend from
            
        Returns:
            Dictionary containing recommendation text and top products
        """
        if not self.openai_api_key:
            return {"error": "OpenAI API key not configured"}
            
        try:
            # Use default products if none provided
            if not products or len(products) == 0:
                products = self._generate_default_products()
            
            # Prepare the products with pH difference
            enriched_products = self._enrich_products(products, scalp_ph)
            
            # Get general advice from OpenAI
            advice_text = ""
            
            try:
                # Call OpenAI API to get advice about scalp pH
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openai_api_key}"
                }
                
                # Create prompt for OpenAI
                prompt = self._create_recommendation_prompt(scalp_ph, symptoms, enriched_products[:3])
                
                payload = {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "You are a scalp health expert providing personalized hair care advice."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1000
                }
                
                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    data=json.dumps(payload)
                )
                
                response.raise_for_status()
                result = response.json()
                
                # Extract advice text
                advice_text = result["choices"][0]["message"]["content"]
                
            except Exception as e:
                print(f"Error getting recommendations from OpenAI: {e}")
                advice_text = "Unable to generate additional recommendations."
            
            # Select top products based on pH match
            top_products = sorted(enriched_products, key=lambda x: x['ph_difference'])[:10]
            
            return {
                "advice_text": advice_text,
                "recommended_products": top_products,
                "scalp_ph": scalp_ph,
                "symptoms": symptoms
            }
            
        except Exception as e:
            print(f"Unexpected error in recommendation process: {e}")
            return {
                "error": f"Failed to get recommendations: {str(e)}",
                "recommended_products": self._enrich_products(products, scalp_ph)[:10] if products else [],
            }
    
    def _enrich_products(self, products, scalp_ph):
        """Enrich products with pH difference, suitability rating, and descriptions"""
        enriched = []
        for product in products:
            if not product.get('name') or product.get('name') == 'Unknown Product':
                continue
            
            # Make a copy to avoid modifying the original
            p = dict(product)
            
            # Calculate pH difference if not already present
            if 'ph_difference' not in p:
                p['ph_difference'] = abs(p['ph_level'] - scalp_ph)
                
            # Add suitability rating if not present
            if 'suitability' not in p:
                p['suitability'] = self._determine_suitability(p['ph_difference'])
                
            # Add descriptive text if not present
            if 'description' not in p:
                p['description'] = self._generate_product_description(p, scalp_ph)
                
            enriched.append(p)
            
        return enriched
            
    def save_recommendations_to_file(self, recommendation_data, filename="recommendations.json"):
        """Save recommendation data to a JSON file"""
        try:
            with open(filename, 'w') as f:
                json.dump(recommendation_data, f, indent=2)
            print(f"Recommendations saved to {filename}")
            return True
        except Exception as e:
            print(f"Error saving recommendations: {e}")
            return False

if __name__ == "__main__":
    # Initialize API integration
    api = PHPerfectAPIIntegration()
    
    # Example scalp pH and symptoms
    scalp_ph = 6.2  # Example pH level
    symptoms = ["dandruff", "itchiness", "dryness"]
    
    # Fetch hair products from Open Beauty Facts API
    hair_products = api.fetch_beauty_products(category="shampoo", count=7)
    hair_products.extend(api.fetch_beauty_products(category="conditioner", count=3))
    
    # Fetch hair products from Sephora API using pH-related queries
    sephora_products = api.fetch_sephora_products(query="oily scalp", count=5)
    hair_products.extend(sephora_products)
    
    # Add more targeted products based on symptoms
    if "dandruff" in symptoms:
        hair_products.extend(api.fetch_sephora_products(query="dandruff shampoo", count=5))
    if "dryness" in symptoms:
        hair_products.extend(api.fetch_sephora_products(query="dry scalp treatment", count=5))
    
    # If not enough products, add default products
    if len(hair_products) < 5:
        hair_products.extend(api._generate_default_products())
    
    # Print fetched products
    print(f"\nFetched {len(hair_products)} hair products")
    
    # Get recommendations
    print("\nGetting personalized recommendations ... ")
    recommendations = api.get_openai_recommendation(scalp_ph, symptoms, hair_products)
    
    # Print recommendation
    if "error" in recommendations:
        print(f"Error: {recommendations['error']}")
    else:
        # Print advice from OpenAI
        print("\nExpert Advice:")
        print(recommendations["advice_text"])
        
        print("\nRecommended Products:")
        for i, product in enumerate(recommendations["recommended_products"], 1):
            # Prepare rating and price information
            rating = f" | Rating: {product['rating']}" if product.get('rating') else ""
            price = f" | Price: {product['price']}" if product.get('price') and product['price'] != 'Price not available' else ""
            
            # Print product details
            print(f"{i}. {product['name']} by {product.get('brand', 'Unknown Brand')} - {product['suitability']}{rating}{price}")
            print(f"   pH: {product['ph_level']} | pH Difference: {product['ph_difference']:.2f}")
            print(f"   {product['description']}")
            print()
            
    # Save recommendations to file
    api.save_recommendations_to_file(recommendations)