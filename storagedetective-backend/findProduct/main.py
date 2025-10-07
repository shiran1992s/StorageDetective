import logging
import json
import base64
import traceback
import functions_framework
import vertexai
from vertexai.vision_models import MultiModalEmbeddingModel, Image as VertexImage
from google.cloud import aiplatform_v1
from google.cloud import storage

logging.basicConfig(level=logging.INFO)

# --- CONFIGURATION ---
PROJECT_ID = "storagedetective"
LOCATION = "us-central1"

API_ENDPOINT = "1073841879.us-central1-325488595361.vdb.vertexai.goog"
INDEX_ENDPOINT = "projects/325488595361/locations/us-central1/indexEndpoints/5301530608810328064"
DEPLOYED_INDEX_ID = "product_search_endpoint_v1_1759833776131"

METADATA_BUCKET = "storagedetective.firebasestorage.app"
METADATA_PREFIX = "json/"

# --- THRESHOLDS FOR IMAGE SEARCH ---
# For dot product distance: LOWER = MORE similar
# Typical ranges: 0.0-0.5 (excellent), 0.5-0.8 (good), 0.8-1.2 (fair), >1.2 (poor)
IMAGE_SEARCH_MAX_DISTANCE = 0.9  # Only show results with distance < 0.9
IMAGE_SEARCH_MIN_THRESHOLD = 0.7  # Only show results with dot product > 0.5
# Maximum candidates to fetch
MAX_CANDIDATES = 30

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Global cache for product metadata
PRODUCT_METADATA_CACHE = {}
METADATA_LOADED = False


def load_product_metadata():
    """Load product metadata from GCS JSON files into memory cache."""
    global PRODUCT_METADATA_CACHE, METADATA_LOADED
    
    if METADATA_LOADED:
        return
    
    try:
        logging.info(f"Loading product metadata from gs://{METADATA_BUCKET}/{METADATA_PREFIX}")
        storage_client = storage.Client()
        bucket = storage_client.bucket(METADATA_BUCKET)
        blobs = bucket.list_blobs(prefix=METADATA_PREFIX)
        
        count = 0
        for blob in blobs:
            if blob.name.endswith('.json'):
                try:
                    json_string = blob.download_as_string()
                    json_data = json.loads(json_string)
                    
                    # MORE FLEXIBLE PARSING
                    if 'structData' in json_data:
                        product = json_data['structData']
                        product_id = product.get('internalId') or json_data.get('id')
                    else:
                        product = json_data
                        product_id = product.get('internalId') or product.get('id')
                    
                    if not product_id:
                        logging.warning(f"No ID found in {blob.name}, JSON: {json_string[:200]}")
                        continue
                    
                    # MORE FLEXIBLE IMAGE URL EXTRACTION
                    image_url = ""
                    if 'images' in product and isinstance(product['images'], list) and len(product['images']) > 0:
                        if isinstance(product['images'][0], dict):
                            image_url = product['images'][0].get('uri', product['images'][0].get('url', ''))
                        else:
                            image_url = product['images'][0]  # Direct URL
                    elif 'uri' in product:
                        image_url = product['uri']
                    elif 'imageUrl' in product:
                        image_url = product['imageUrl']
                    elif 'image' in product:
                        image_url = product['image']
                    
                    if not image_url:
                        logging.warning(f"No image URL for {product.get('title', 'unknown')} (ID: {product_id})")
                    
                    # Cache metadata
                    PRODUCT_METADATA_CACHE[product_id] = {
                        'title': product.get('title', product.get('name', 'Unknown')),
                        'description': product.get('description', ''),
                        'location': product.get('productLocation', product.get('location', 'N/A')),
                        'imageUrl': image_url,
                        'categories': product.get('categories', []),
                        'available_time': product.get('available_time', '')
                    }
                    count += 1
                    logging.info(f"Loaded: {product.get('title', 'Unknown')} - Image: {'Yes' if image_url else 'NO'}")
                        
                except Exception as e:
                    logging.warning(f"Failed to load metadata from {blob.name}: {e}")
        
        METADATA_LOADED = True
        logging.info(f"✓ Loaded metadata for {count} products")
        
    except Exception as e:
        logging.error(f"Failed to load product metadata: {e}")


@functions_framework.http
def find_product(request):
    """HTTP Cloud Function for intelligent product search."""
    
    frontend_url = "*"
    headers = {'Access-Control-Allow-Origin': frontend_url}
    
    if request.method == 'OPTIONS':
        headers.update({
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        })
        return ('', 204, headers)

    request_json = request.get_json(silent=True)
    if not request_json:
        return (json.dumps({'error': 'Invalid JSON'}), 400, headers)

    image_base64 = request_json.get('image_base64')
    text_query = request_json.get('text_query')
    num_results = int(request_json.get('num_results', 1))
    offset = int(request_json.get('offset', 0))

    if not image_base64 and not text_query:
        return (json.dumps({'error': 'Must provide image_base64 or text_query'}), 400, headers)

    search_mode = 'image' if image_base64 else 'text'
    logging.info(f"=== SEARCH START ===")
    logging.info(f"Mode: {search_mode}, Query: '{text_query}', Offset: {offset}")

    try:
        load_product_metadata()
        
        # Generate embedding
        if image_base64:
            logging.info("Generating image embedding...")
            query_embedding = generate_image_embedding(image_base64, text_query)
        else:
            logging.info("Generating text embedding...")
            query_embedding = generate_text_embedding(text_query)
        
        # Search Vector Search
        similar_products = search_similar_products(query_embedding, MAX_CANDIDATES)
        
        # Log raw results for debugging
        logging.info(f"=== RAW RESULTS (top 10) ===")
        for i, p in enumerate(similar_products[:10]):
            meta = PRODUCT_METADATA_CACHE.get(p['id'], {})
            logging.info(f"#{i+1}: {meta.get('title', 'Unknown'):30s} Distance: {p['distance']:.4f}")
        
        # Apply intelligent filtering
        if search_mode == 'text':
            filtered_products = filter_text_search_smart(similar_products, text_query)
        else:
            filtered_products = filter_image_search_smart(similar_products)
        
        logging.info(f"=== AFTER FILTERING: {len(filtered_products)} products ===")
        for i, p in enumerate(filtered_products[:5]):
            meta = PRODUCT_METADATA_CACHE.get(p['id'], {})
            logging.info(f"#{i+1}: {meta.get('title', 'Unknown'):30s} Distance: {p['distance']:.4f} Score: {p.get('match_score', 0):.1f}%")
        
        # Pagination
        paginated_products = filtered_products[offset:offset + num_results]
        has_more = len(filtered_products) > (offset + num_results)
        
        # Enrich results
        results = []
        for product in paginated_products:
            product_id = product['id']
            metadata = PRODUCT_METADATA_CACHE.get(product_id, {})
            
            # Use the calculated match score from filtering
            match_percentage = product.get('match_score', 0)
            quality = get_match_quality_from_percentage(match_percentage)
            
            results.append({
                "id": product_id,
                "title": metadata.get('title', 'Unknown'),
                "location": metadata.get('location', 'N/A'),
                "imageUrl": metadata.get('imageUrl', ''),
                "description": metadata.get('description', ''),
                "categories": metadata.get('categories', []),
                "similarity_percentage": match_percentage,
                "match_quality": quality,
                "raw_distance": round(product['distance'], 4),
                "search_mode": search_mode
            })
        
        message = f"Found {len(filtered_products)} matching product(s)" if results else "No matching products found"
        
        return (json.dumps({
            "results": results,
            "message": message,
            "total_matches": len(filtered_products),
            "has_more": has_more,
            "search_mode": search_mode
        }), 200, headers)

    except Exception as e:
        error_trace = traceback.format_exc()
        logging.error(f"Search failed: {e}\n{error_trace}")
        return (json.dumps({"message": "Search failed.", "error": str(e)}), 500, headers)


def filter_text_search_smart(products, text_query):
    """Smart filtering for text searches with keyword matching."""
    if not text_query:
        return []
    
    text_query = text_query.strip().lower()
    keywords = text_query.split()
    
    logging.info(f"Text search for keywords: {keywords}")
    
    filtered = []
    
    for product in products:
        product_id = product['id']
        metadata = PRODUCT_METADATA_CACHE.get(product_id, {})
        
        title = metadata.get('title', '').lower()
        description = metadata.get('description', '').lower()
        categories = ' '.join(metadata.get('categories', [])).lower()
        combined_text = f"{title} {description} {categories}"
        
        # Calculate keyword matching
        exact_matches = 0
        
        for keyword in keywords:
            if keyword in title:
                exact_matches += 2  # Title matches are more important
            elif keyword in description:
                exact_matches += 1
            elif keyword in categories:
                exact_matches += 1
        
        # Only include if there are keyword matches
        if exact_matches == 0:
            continue
        
        # Calculate match percentage
        # For text: prioritize keyword matching
        keyword_percentage = min(100, (exact_matches / len(keywords)) * 100)
        vector_similarity = calculate_similarity_from_distance(product['distance'])
        
        # 70% keyword + 30% vector similarity
        combined_score = (keyword_percentage * 0.7) + (vector_similarity * 0.3)
        
        product['match_score'] = round(combined_score, 1)
        product['keyword_matches'] = exact_matches
        product['sort_score'] = exact_matches * 1000 + vector_similarity
        
        filtered.append(product)
    
    # Sort by keyword matches first, then similarity
    filtered.sort(key=lambda x: x['sort_score'], reverse=True)
    
    return filtered


def filter_image_search_smart(products):
    """
    Smart filtering for image searches.
    For DOT PRODUCT: HIGHER distance = MORE similar!
    STRICT FILTERING: Only show genuinely similar items.
    """
    filtered = []
    
    for product in products:
        distance = product['distance']
        
        # STRICT: Only keep products with dot product > 0.5
        if distance < IMAGE_SEARCH_MIN_THRESHOLD:
            continue
        
        # Calculate similarity: Higher dot product = Higher percentage
        similarity = min(100, distance * 100)
        
        product['match_score'] = round(similarity, 1)
        product['sort_score'] = distance
        
        filtered.append(product)
    
    # Sort by distance: HIGHEST first (most similar)
    filtered.sort(key=lambda x: x['sort_score'], reverse=True)
    
    logging.info(f"Image search: kept {len(filtered)} products with dot product > {IMAGE_SEARCH_MIN_THRESHOLD}")
    
    return filtered





def calculate_similarity_from_distance(distance):
    """
    For DOT PRODUCT: Higher value = more similar.
    Typical range: 0.0 (unrelated) to 1.0 (identical)
    """
    # Direct scaling: dot product is already 0-1 range
    similarity = min(100, max(0, distance * 100))
    return round(similarity, 1)


def get_match_quality_from_percentage(percentage):
    """Get match quality label based on percentage score."""
    if percentage >= 80:
        return 'excellent'
    elif percentage >= 70:
        return 'good'
    elif percentage >= 60:
        return 'fair'
    else:
        return 'poor'


def generate_image_embedding(image_base64, contextual_text=None):
    """
    Generate IMAGE-ONLY embedding for consistency with indexed products.
    CRITICAL: Must match the indexing approach (image-only).
    """
    try:
        model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding@001")
        image_bytes = base64.b64decode(image_base64)
        image = VertexImage(image_bytes=image_bytes)
        
        # IMAGE ONLY - no text context for pure visual search
        embeddings = model.get_embeddings(
            image=image,
            contextual_text=None,  # ← IMAGE ONLY!
            dimension=512
        )
        
        logging.info(f"Generated IMAGE-ONLY embedding: {len(embeddings.image_embedding)} dims")
        return embeddings.image_embedding
        
    except Exception as e:
        logging.error(f"Failed to generate image embedding: {e}")
        raise
        
    except Exception as e:
        logging.error(f"Failed to generate image embedding: {e}")
        raise


def generate_text_embedding(text):
    """Generate embedding for text."""
    try:
        model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding@001")
        
        embeddings = model.get_embeddings(
            contextual_text=text,
            dimension=512
        )
        
        return embeddings.text_embedding
        
    except Exception as e:
        logging.error(f"Failed to generate text embedding: {e}")
        raise


def search_similar_products(query_embedding, num_neighbors=30):
    """Search for similar products using Vector Search."""
    try:
        client_options = {"api_endpoint": API_ENDPOINT}
        vector_search_client = aiplatform_v1.MatchServiceClient(
            client_options=client_options
        )
        
        datapoint = aiplatform_v1.IndexDatapoint(
            feature_vector=query_embedding
        )
        
        query = aiplatform_v1.FindNeighborsRequest.Query(
            datapoint=datapoint,
            neighbor_count=num_neighbors
        )
        
        find_neighbors_request = aiplatform_v1.FindNeighborsRequest(
            index_endpoint=INDEX_ENDPOINT,
            deployed_index_id=DEPLOYED_INDEX_ID,
            queries=[query],
            return_full_datapoint=False
        )
        
        response = vector_search_client.find_neighbors(find_neighbors_request)
        
        results = []
        if response.nearest_neighbors:
            for neighbor in response.nearest_neighbors[0].neighbors:
                results.append({
                    "id": neighbor.datapoint.datapoint_id,
                    "distance": float(neighbor.distance)
                })
        
        return results
        
    except Exception as e:
        logging.error(f"Vector Search failed: {e}")
        raise
