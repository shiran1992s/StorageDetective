import json
import logging
import functions_framework
import vertexai
from vertexai.vision_models import MultiModalEmbeddingModel, Image as VertexImage
from google.cloud import aiplatform
from google.cloud import storage
import requests
import numpy as np
from cloudevents.http import CloudEvent

logging.basicConfig(level=logging.INFO)

# Configuration
PROJECT_ID = "storagedetective"
PROJECT_NUMBER = "325488595361"
LOCATION = "us-central1"
EMBEDDING_DIMENSION = 512

INDEX_ID = "8707413011381354496"
INDEX_NAME = f"projects/{PROJECT_NUMBER}/locations/{LOCATION}/indexes/{INDEX_ID}"

aiplatform.init(project=PROJECT_ID, location=LOCATION)


@functions_framework.cloud_event
def add_product_embedding(cloud_event: CloudEvent):
    """
    Triggered when JSON is uploaded.
    Generates AVERAGED embedding from ALL product images.
    """
    
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
        
        # Get ALL image URIs
        image_uris = []
        if 'images' in product and isinstance(product['images'], list):
            for img in product['images']:
                if isinstance(img, dict):
                    uri = img.get('uri')
                    if uri:
                        image_uris.append(uri)
                elif isinstance(img, str):
                    image_uris.append(img)
        elif 'uri' in product:
            image_uris.append(product['uri'])
        
        if not image_uris:
            logging.warning(f"No images found for product: {product_id}")
            return
        
        logging.info(f"Processing {len(image_uris)} image(s) for: {product.get('title', 'Unknown')}")
        
        # Initialize model
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding@001")
        
        # Generate embedding for EACH image
        all_embeddings = []
        for i, image_uri in enumerate(image_uris):
            try:
                logging.info(f"  → Processing image {i+1}/{len(image_uris)}")
                image_bytes = requests.get(image_uri, timeout=10).content
                image = VertexImage(image_bytes=image_bytes)
                
                embeddings = model.get_embeddings(
                    image=image,
                    contextual_text=None,  # IMAGE ONLY
                    dimension=EMBEDDING_DIMENSION
                )
                
                all_embeddings.append(embeddings.image_embedding)
                logging.info(f"  ✓ Generated embedding for image {i+1}")
                
            except Exception as e:
                logging.error(f"  ✗ Failed to process image {i+1}: {e}")
                continue
        
        if not all_embeddings:
            logging.error(f"Failed to generate any embeddings for: {product_id}")
            return
        
        # AVERAGE all embeddings into one
        if len(all_embeddings) == 1:
            final_embedding = all_embeddings[0]
            logging.info(f"Using single embedding")
        else:
            embedding_array = np.array(all_embeddings)
            final_embedding = np.mean(embedding_array, axis=0).tolist()
            logging.info(f"✓ Averaged {len(all_embeddings)} embeddings into one")
        
        logging.info(f"Final embedding dimension: {len(final_embedding)}")
        
        # Upsert to index
        my_index = aiplatform.MatchingEngineIndex(index_name=INDEX_NAME)
        my_index.upsert_datapoints(datapoints=[{
            "datapoint_id": product_id,
            "feature_vector": final_embedding
        }])
        
        logging.info(f"✓✓✓ Indexed: {product.get('title', 'Unknown')} with {len(image_uris)} image(s)")
        
    except Exception as e:
        logging.error(f"Failed: {e}", exc_info=True)
