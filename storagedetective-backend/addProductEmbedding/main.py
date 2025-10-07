import json
import logging
import functions_framework
import vertexai
from vertexai.vision_models import MultiModalEmbeddingModel, Image as VertexImage
from google.cloud import aiplatform
from google.cloud import storage
import requests
from cloudevents.http import CloudEvent

logging.basicConfig(level=logging.INFO)

# --- CONFIGURATION ---
PROJECT_ID = "storagedetective"
PROJECT_NUMBER = "325488595361"
LOCATION = "us-central1"
EMBEDDING_DIMENSION = 512

# Index ID
INDEX_ID = "8707413011381354496"
INDEX_NAME = f"projects/{PROJECT_NUMBER}/locations/{LOCATION}/indexes/{INDEX_ID}"

# Initialize Vertex AI
aiplatform.init(project=PROJECT_ID, location=LOCATION)


@functions_framework.cloud_event
def add_product_embedding(cloud_event: CloudEvent):
    """
    Triggered when JSON is uploaded to json/ folder.
    Generates IMAGE-ONLY embedding for pure visual search.
    """
    
    # Extract bucket and file name
    try:
        if isinstance(cloud_event.data, dict):
            bucket_name = cloud_event.data.get("bucket")
            file_name = cloud_event.data.get("name")
        else:
            bucket_name = cloud_event.get("bucket")
            file_name = cloud_event.get("name")
        
        if not bucket_name or not file_name:
            subject = cloud_event.get("subject", "")
            if "/buckets/" in subject and "/objects/" in subject:
                parts = subject.split("/")
                bucket_name = parts[parts.index("buckets") + 1]
                file_name = "/".join(parts[parts.index("objects") + 1:])
        
        logging.info(f"Processing: gs://{bucket_name}/{file_name}")
        
        if not bucket_name or not file_name:
            return
            
    except Exception as e:
        logging.error(f"Error parsing event: {e}", exc_info=True)
        return
    
    # Only process JSON in json/ folder
    if not file_name.startswith("json/") or not file_name.endswith(".json"):
        return
    
    try:
        # Read JSON
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name)
        json_string = blob.download_as_string()
        json_data = json.loads(json_string)
        
        # Extract product
        if 'structData' in json_data:
            product = json_data['structData']
            product_id = product.get('internalId') or json_data.get('id')
        else:
            product = json_data
            product_id = product.get('internalId')
        
        if not product_id:
            return
        
        # Get image URI
        image_uri = None
        if 'images' in product and len(product['images']) > 0:
            image_uri = product['images'][0].get('uri')
        elif 'uri' in product:
            image_uri = product['uri']
        
        if not image_uri:
            return
        
        logging.info(f"Processing: {product.get('title', 'Unknown')} (ID: {product_id})")
        
        # Download image
        image_bytes = requests.get(image_uri, timeout=10).content
        
        # Initialize embedding model
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding@001")
        image = VertexImage(image_bytes=image_bytes)
        
        # CRITICAL: Generate IMAGE-ONLY embedding (no text context)
        logging.info("Generating IMAGE-ONLY embedding...")
        embeddings = model.get_embeddings(
            image=image,
            contextual_text=None,  # ← IMAGE ONLY!
            dimension=EMBEDDING_DIMENSION
        )
        embedding = embeddings.image_embedding
        
        logging.info(f"Generated {len(embedding)}-dim embedding")
        
        # Upsert to streaming index
        my_index = aiplatform.MatchingEngineIndex(index_name=INDEX_NAME)
        my_index.upsert_datapoints(datapoints=[{
            "datapoint_id": product_id,
            "feature_vector": embedding
        }])
        
        logging.info(f"✓ Indexed: {product.get('title', 'Unknown')}")
        logging.info(f"✓ Using IMAGE-ONLY embedding for pure visual search")
        
    except Exception as e:
        logging.error(f"Failed: {e}", exc_info=True)
