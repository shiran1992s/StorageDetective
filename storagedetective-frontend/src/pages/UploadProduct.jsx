// src/pages/UploadProduct.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { storage } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

// The name of the GCS bucket Vertex AI Search is watching.
const INGESTION_BUCKET_NAME = "storagedetective.firebasestorage.app"; // <-- IMPORTANT: Change to your bucket name

function UploadProduct() {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
	e.preventDefault();
	if (!productName || !location || !imageFile) {
	  setMessage('Error: Please fill in product name, location, and add a photo.');
	  return;
	}
	setLoading(true);
	setMessage('Uploading product to library...');

	try {
	  const uniqueId = uuidv4();
	  const fileExtension = imageFile.name.split('.').pop();
	  const imageFileName = `${uniqueId}.${fileExtension}`;
	  const jsonFileName = `${uniqueId}.json`;

	  const imageRef = ref(storage, `images/${imageFileName}`);
	  const snapshot = await uploadBytes(imageRef, imageFile);
	  const imageUrl = await getDownloadURL(snapshot.ref);
	  const jsonRef = ref(storage, `json/${jsonFileName}`);
	  // --- THIS IS THE FINAL, CORRECT METADATA STRUCTURE ---
	  const metadata = {
		  id: uniqueId,
		  structData: {
			uri: imageUrl,
		    images: [
			{
			  name: productName, // You can change this or make it dynamic
			  uri: imageUrl 
			}
			],
		    title: productName,
		    description: description,
		    categories: ["Product", "Warehouse Inventory"],
		    productLocation: location,
		    internalId: jsonFileName.replace('.json', ''),
			available_time: new Date().toISOString()
		  }
		};



	  
	  
	  await uploadString(jsonRef, JSON.stringify(metadata), 'raw', {
		 contentType: 'application/json'
	  });
	  // --- END OF FIX ---

	  setMessage(`✅ Success! Product added. It will be searchable shortly.`);
	  setProductName(''); setDescription(''); setLocation('');
	  setImageFile(null); setPreview('');

	} catch (error) {
	  setMessage(`❌ Error: ${error.message}`);
	} finally {
	  setLoading(false);
	}
};

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">← Back to Home</Link>
      <h2 className="text-2xl font-bold mb-6">Upload New Product</h2>
      <p className="text-gray-600 mb-4">New products will be automatically indexed and made searchable.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields are the same as before */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Photo</label>
          <input type="file" accept="image/*" onChange={handleImageChange} required 
                 className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        </div>
        {preview && <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-md" />}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required 
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location in Warehouse (e.g., Aisle 4, Shelf B-2)</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition">
          {loading ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>
      {message && <p className={`mt-4 p-3 rounded-md text-center ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
    </div>
  );
}

export default UploadProduct;