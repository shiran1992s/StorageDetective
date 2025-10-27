"""
Complete get_products.py with multi-image support
"""

import json
import logging
import traceback
import functions_framework
import vertexai
from vertexai.vision_models import MultiModalEmbeddingModel, Image as VertexImage
from google.cloud import storage, aiplatform
import requests
import numpy as np

logging.basicConfig(level=logging.INFO)

PROJECT_ID = "storagedetective"
PROJECT_NUMBER = "325488595361"
LOCATION = "us-central1"
METADATA_BUCKET = "storagedetective.firebasestorage.app"
METADATA_PREFIX = "json/"
IMAGES_PREFIX = "images/"
EMBEDDING_DIMENSION = 512

INDEX_ID = "8707413011381354496"
INDEX_NAME = f"projects/{PROJECT_NUMBER}/locations/{LOCATION}/indexes/{INDEX_ID}"

vertexai.init(project=PROJECT_ID, location=LOCATION)
aiplatform.init(project=PROJECT_ID, location=LOCATION)


@functions_framework.http
def get_products(request):
    """HTTP Cloud Function to manage products."""
    
    frontend_url = "*"
    headers = {
        'Access-Control-Allow-Origin': frontend_url,
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    if request.method == 'OPTIONS':
        return ('', 204, headers)
    
    if request.method == 'GET':
        try:
            logging.info("GET request - Fetching all products")
            products = fetch_all_products()
            return (json.dumps({"products": products}), 200, headers)
        except Exception as e:
            logging.error(f"Error in GET: {e}\n{traceback.format_exc()}")
            return (json.dumps({"error": str(e)}), 500, headers)
    
    elif request.method == 'PUT':
        try:
            request_json = request.get_json(silent=True)
            if not request_json or 'product' not in request_json:
                return (json.dumps({"error": "Invalid request"}), 400, headers)
            
            product_data = request_json['product']
            product_id = product_data.get('id')
            images_changed = request_json.get('imagesChanged', False)
            
            if not product_id:
                return (json.dumps({"error": "Product ID required"}), 400, headers)
            
            logging.info(f"Updating: {product_id} (images changed: {images_changed})")
            
            update_product(product_id, product_data)
            
            if images_changed:
                logging.info(f"Images changed - regenerating embedding: {product_id}")
                image_urls = product_data.get('imageUrls', [])
                update_product_embedding(product_id, image_urls)
            
            return (json.dumps({"message": "Product updated successfully"}), 200, headers)
        except Exception as e:
            logging.error(f"Error in PUT: {e}\n{traceback.format_exc()}")
            return (json.dumps({"error": str(e)}), 500, headers)
    
    elif request.method == 'DELETE':
        try:
            product_id = request.args.get('id')
            if not product_id:
                return (json.dumps({"error": "Product ID required"}), 400, headers)
            
            delete_product(product_id)
            return (json.dumps({"message": "Product deleted successfully"}), 200, headers)
        except Exception as e:
            logging.error(f"Error in DELETE: {e}\n{traceback.format_exc()}")
            return (json.dumps({"error": str(e)}), 500, headers)
    
    return (json.dumps({"error": "Method not allowed"}), 405, headers)


def fetch_all_products():
    """Fetch all products with multi-image support."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(METADATA_BUCKET)
    blobs = bucket.list_blobs(prefix=METADATA_PREFIX)
    
    products = []
    
    for blob in blobs:
        if not blob.name.endswith('.json'):
            continue
            
        try:
            json_string = blob.download_as_string()
            json_data = json.loads(json_string)
            
            if 'structData' in json_data:
                product = json_data['structData']
                product['id'] = product.get('internalId') or json_data.get('id')
            else:
                product = json_data
                if 'internalId' not in product and 'id' in json_data:
                    product['id'] = json_data['id']
            
            # Extract ALL image URLs
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
                image_urls.append(product['uri'])
            elif 'imageUrl' in product:
                image_urls.append(product['imageUrl'])
            
            products.append({
                'id': product.get('id', product.get('internalId')),
                'title': product.get('title', 'Unknown'),
				'catalogNumber': product.get('catalogNumber', 'N/A'),
                'description': product.get('description', ''),
				'imageUrl': image_urls[0] if image_urls else '',
                'imageUrls': image_urls,
                'categories': product.get('categories', []),
                'available_time': product.get('available_time', '')
            })
            
        except Exception as e:
            logging.warning(f"Failed to load {blob.name}: {e}")
    
    products.sort(key=lambda x: x.get('title', '').lower())
    return products


def update_product(product_id, updated_data):
    """Update product with multi-image support."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(METADATA_BUCKET)
    blob = bucket.blob(f"{METADATA_PREFIX}{product_id}.json")
    
    if blob.exists():
        json_string = blob.download_as_string()
        existing_data = json.loads(json_string)
    else:
        existing_data = {'id': product_id, 'structData': {}}
    
    struct_data = existing_data.get('structData', {})
    struct_data['internalId'] = product_id
    struct_data['title'] = updated_data.get('title', struct_data.get('title', ''))
    struct_data['description'] = updated_data.get('description', struct_data.get('description', ''))
    struct_data['structData']['catalogNumber'] = product_data.get('catalogNumber', 'N/A')

     
    # Update images array
    if 'imageUrls' in updated_data:
        struct_data['images'] = [{'uri': url} for url in updated_data['imageUrls']]
    elif 'images' not in struct_data:
        struct_data['images'] = []
    
    struct_data['categories'] = updated_data.get('categories', struct_data.get('categories', []))
    struct_data['available_time'] = updated_data.get('available_time', struct_data.get('available_time', ''))
    
    existing_data['structData'] = struct_data
    existing_data['id'] = product_id
    
    blob.upload_from_string(json.dumps(existing_data, indent=2), content_type='application/json')
    logging.info(f"✓ Updated: {product_id}")


def update_product_embedding(product_id, image_urls):
    """Regenerate AVERAGED embedding from ALL images."""
    try:
        if not image_urls:
            logging.warning(f"No images for {product_id}")
            return
        
        logging.info(f"Generating embeddings for {len(image_urls)} image(s)")
        
        model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding@001")
        all_embeddings = []
        
        for i, image_url in enumerate(image_urls):
            try:
                logging.info(f"  Processing image {i+1}/{len(image_urls)}")
                response = requests.get(image_url, timeout=30)
                response.raise_for_status()
                image_bytes = response.content
                
                image = VertexImage(image_bytes=image_bytes)
                embeddings = model.get_embeddings(
                    image=image,
                    contextual_text=None,
                    dimension=EMBEDDING_DIMENSION
                )
                
                all_embeddings.append(embeddings.image_embedding)
                logging.info(f"  ✓ Generated embedding {i+1}")
            except Exception as e:
                logging.error(f"  ✗ Failed image {i+1}: {e}")
        
        if not all_embeddings:
            raise Exception("No embeddings generated")
        
        # Average embeddings
        if len(all_embeddings) > 1:
            embedding_array = np.array(all_embeddings)
            final_embedding = np.mean(embedding_array, axis=0).tolist()
            logging.info(f"✓ Averaged {len(all_embeddings)} embeddings")
        else:
            final_embedding = all_embeddings[0]
        
        # Update index
        my_index = aiplatform.MatchingEngineIndex(index_name=INDEX_NAME)
        my_index.upsert_datapoints(datapoints=[{
            "datapoint_id": product_id,
            "feature_vector": final_embedding
        }])
        
        logging.info(f"✓✓✓ Updated embedding in index: {product_id}")
        
    except Exception as e:
        logging.error(f"Failed to update embedding: {e}")
        raise


def delete_product(product_id):
    """Delete product and ALL its images."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(METADATA_BUCKET)
    
    logging.info(f"Deleting: {product_id}")
    
    # Remove from index
    try:
        my_index = aiplatform.MatchingEngineIndex(index_name=INDEX_NAME)
        my_index.remove_datapoints(datapoint_ids=[product_id])
        logging.info(f"✓ Removed from index")
    except Exception as e:
        logging.warning(f"⚠ Index removal failed: {e}")
    
    # Delete JSON
    try:
        json_blob = bucket.blob(f"{METADATA_PREFIX}{product_id}.json")
        if json_blob.exists():
            json_blob.delete()
            logging.info(f"✓ Deleted JSON")
    except Exception as e:
        logging.warning(f"⚠ JSON deletion failed: {e}")
    
    # Delete ALL images (pattern: productId_0.jpg, productId_1.jpg, etc.)
    try:
        all_blobs = bucket.list_blobs(prefix=IMAGES_PREFIX)
        deleted_count = 0
        for blob in all_blobs:
            if blob.name.startswith(f"{IMAGES_PREFIX}{product_id}_") or blob.name == f"{IMAGES_PREFIX}{product_id}.jpg":
                blob.delete()
                deleted_count += 1
                logging.info(f"✓ Deleted image: {blob.name}")
        
        if deleted_count > 0:
            logging.info(f"✓ Deleted {deleted_count} image(s)")
    except Exception as e:
        logging.warning(f"⚠ Image deletion failed: {e}")
    
    logging.info(f"✓✓✓ Deletion complete: {product_id}")
