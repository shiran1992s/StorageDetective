import functions_framework
import firebase_admin
from firebase_admin import auth, firestore
import google.cloud.aiplatform as aiplatform
from google.cloud.storage import Client as StorageClient

from flask import request, jsonify
import vertexai
from vertexai.language_models import TextEmbeddingModel
from vertexai.vision_models import Image, MultiModalEmbeddingModel
from urllib.parse import urlparse

import os
import uuid

# --- CONFIGURATION (populated by environment variables) ---
GCP_PROJECT_ID = "storagedetective"
GCP_REGION = "us-west1"
VECTOR_SEARCH_ENDPOINT_ID = "782731332697456640"
VECTOR_SEARCH_DEPLOYED_INDEX_ID = "v1"

# --- INITIALIZATION ---
firebase_admin.initialize_app()
aiplatform.init(project=GCP_PROJECT_ID, location=GCP_REGION)
embedding_model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding")
db = firestore.client()
storage_client = StorageClient()
index_endpoint = aiplatform.MatchingEngineIndexEndpoint(VECTOR_SEARCH_ENDPOINT_ID)

# --- HELPER FUNCTIONS ---
def get_image_bytes(gcs_uri: str) -> bytes:
    """Downloads an image from a GCS URI and returns its bytes."""
    parsed_url = urlparse(gcs_uri)
    bucket_name = parsed_url.netloc
    object_name = parsed_url.path.lstrip('/')
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(object_name)
    return blob.download_as_bytes()

def get_user_from_token(request):
    """Verifies Firebase auth token from request header."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    try:
        return auth.verify_id_token(auth_header.split('Bearer ')[1])
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

# --- CLOUD FUNCTIONS ---
@functions_framework.http
def addProduct(request):
    if request.method == 'OPTIONS':
        headers = {'Access-Control-Allow-Origin': '*','Access-Control-Allow-Methods': 'POST','Access-Control-Allow-Headers': 'Content-Type, Authorization',}
        return ('', 204, headers)
    headers = {'Access-Control-Allow-Origin': '*'}

    if not get_user_from_token(request):
        return jsonify({"error": "Unauthorized"}), 403, headers

    data = request.get_json()
    if not all(k in data for k in ['productName', 'location', 'imageUrl']):
        return jsonify({"error": "Missing required fields"}), 400, headers

    try:
        product_id = str(uuid.uuid4())
        image_bytes = get_image_bytes(data['imageUrl'])
        combined_text = f"Product: {data['productName']}, Description: {data.get('description', '')}"

        # 1. Generate Embedding (using new model logic)
        image = Image(image_bytes)
        embedding = embedding_model.get_embeddings(image=image, contextual_text=combined_text)
        vector_embedding = embedding.image_embedding # Use .image_embedding for the vector

        # 2. Save metadata to Firestore
        product_ref = db.collection('products').document(product_id)
        product_ref.set({'productName': data['productName'],'description': data.get('description', ''), 'location': data['location'],'imageUrl': data['imageUrl']})
        
        # 3. Upsert embedding to Vector Search
        index_endpoint.upsert_datapoints(
            index_id=VECTOR_SEARCH_DEPLOYED_INDEX_ID,
            datapoints=[{'datapoint_id': product_id, 'feature_vector': vector_embedding}]
        )

        return jsonify({"success": True, "productId": product_id}), 200, headers
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500, headers