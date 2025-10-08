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
IMAGE_SEARCH_MIN_THRESHOLD = 0.75  # Normal threshold
IMAGE_SEARCH_FALLBACK_THRESHOLD = 0.0  # For "at least 1 result" fallback

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
                    
                    if 'structData' in json_data:
                        product = json_data['structData']
                        product_id = product.get('internalId') or json_data.get('id')
                    else:
                        product = json_data
                        product_id = product.get('internalId') or product.get('id')
                    
                    if not product_id:
                        logging.warning(f"No ID found in {blob.name}")
                        continue
                    
                    image_urls = []
                    if 'images' in product and isinstance(product['images'], list):
                        for img in product['images']:
                            if isinstance(img, dict):
                                url = img.get('uri', img.get('url', ''))
                                if url:
                                    image_urls.append(url)
                            elif isinstance(img, str):
                                image_urls.append(img)
                    elif 'uri' in product:
                        image_urls = [product['uri']]
                    elif 'imageUrl' in product:
                        image_urls = [product['imageUrl']]
                    
                    PRODUCT_METADATA_CACHE[product_id] = {
                        'title': product.get('title', 'Unknown'),
                        'description': product.get('description', ''),
                        'location': product.get('productLocation', product.get('location', 'N/A')),
                        'imageUrls': image_urls,
                        'imageUrl': image_urls[0] if image_urls else '',
                        'categories': product.get('categories', []),
                        'available_time': product.get('available_time', ''),
                        'coordinates': product.get('coordinates', None)
                    }
                    
                    count += 1
                        
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
    num_results = int(request_json.get('num_results', 20))
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
        
        # Apply intelligent filtering
        if search_mode == 'text':
            filtered_products = filter_text_search_smart(similar_products, text_query)
        else:
            filtered_products = filter_image_search_smart(similar_products)
            
            # NEW: If image search returns 0 results, get at least the best 1
            if len(filtered_products) == 0:
                logging.info("No results above threshold - returning best match")
                filtered_products = filter_image_search_fallback(similar_products)
                
                if len(filtered_products) > 0:
                    filtered_products[0]['is_low_confidence'] = True
        
        logging.info(f"=== AFTER FILTERING: {len(filtered_products)} products ===")
        
        # Pagination
        paginated_products = filtered_products[offset:offset + num_results]
        has_more = len(filtered_products) > (offset + num_results)
        
        # Enrich results
        results = []
        for product in paginated_products:
            product_id = product['id']
            metadata = PRODUCT_METADATA_CACHE.get(product_id, {})
            
            match_percentage = product.get('match_score', 0)
            quality = get_match_quality_from_percentage(match_percentage)
            
            image_urls = []
            if 'imageUrls' in metadata and isinstance(metadata['imageUrls'], list):
                image_urls = metadata['imageUrls']
            elif 'imageUrl' in metadata and metadata['imageUrl']:
                image_urls = [metadata['imageUrl']]
            
            results.append({
                "id": product_id,
                "title": metadata.get('title', 'Unknown'),
                "location": metadata.get('location', 'N/A'),
                "imageUrl": image_urls[0] if image_urls else '',
                "imageUrls": image_urls,
                "description": metadata.get('description', ''),
                "categories": metadata.get('categories', []),
                "similarity_percentage": match_percentage,
                "match_quality": quality,
                "raw_distance": round(product['distance'], 4),
                "search_mode": search_mode,
                "coordinates": metadata.get('coordinates'),
                "is_low_confidence": product.get('is_low_confidence', False)
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
    
    filtered = []
    
    for product in products:
        product_id = product['id']
        metadata = PRODUCT_METADATA_CACHE.get(product_id, {})
        
        title = metadata.get('title', '').lower()
        description = metadata.get('description', '').lower()
        categories = ' '.join(metadata.get('categories', [])).lower()
        
        exact_matches = 0
        
        for keyword in keywords:
            if keyword in title:
                exact_matches += 2
            elif keyword in description:
                exact_matches += 1
            elif keyword in categories:
                exact_matches += 1
        
        if exact_matches == 0:
            continue
        
        keyword_percentage = min(100, (exact_matches / len(keywords)) * 100)
        vector_similarity = calculate_similarity_from_distance(product['distance'])
        
        combined_score = (keyword_percentage * 0.7) + (vector_similarity * 0.3)
        
        product['match_score'] = round(combined_score, 1)
        product['keyword_matches'] = exact_matches
        product['sort_score'] = exact_matches * 1000 + vector_similarity
        
        filtered.append(product)
    
    filtered.sort(key=lambda x: x['sort_score'], reverse=True)
    
    return filtered


def filter_image_search_smart(products):
    """
    Smart filtering for image searches with threshold.
    """
    filtered = []
    
    for product in products:
        distance = product['distance']
        
        if distance < IMAGE_SEARCH_MIN_THRESHOLD:
            continue
        
        similarity = min(100, distance * 100)
        
        product['match_score'] = round(similarity, 1)
        product['sort_score'] = distance
        
        filtered.append(product)
    
    filtered.sort(key=lambda x: x['sort_score'], reverse=True)
    
    return filtered


def filter_image_search_fallback(products):
    """
    Fallback filter for image search - returns best match regardless of threshold.
    Used when no results pass the main threshold.
    """
    if not products:
        return []
    
    # Just get the single best match
    best_product = products[0]
    
    similarity = min(100, best_product['distance'] * 100)
    best_product['match_score'] = round(similarity, 1)
    best_product['sort_score'] = best_product['distance']
    
    logging.info(f"Fallback: returning best match '{PRODUCT_METADATA_CACHE.get(best_product['id'], {}).get('title', 'Unknown')}' with score {similarity}%")
    
    return [best_product]


def calculate_similarity_from_distance(distance):
    """For DOT PRODUCT: Higher value = more similar."""
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
    """Generate IMAGE-ONLY embedding."""
    try:
        model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding@001")
        image_bytes = base64.b64decode(image_base64)
        image = VertexImage(image_bytes=image_bytes)
        
        embeddings = model.get_embeddings(
            image=image,
            contextual_text=None,
            dimension=512
        )
        
        return embeddings.image_embedding
        
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
