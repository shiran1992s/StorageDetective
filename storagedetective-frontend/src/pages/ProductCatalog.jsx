import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = 'https://storage-detective-get-products-325488595361.us-west1.run.app';
const GOOGLE_MAPS_API_KEY = 'AIzaSyA54LyFjvVof2S3qvnTRrtXgFQg_TSp7hw';
const MAX_IMAGES = 10;

function ProductCatalog() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!editingProduct || mapLoaded) return;

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, [editingProduct, mapLoaded]);

  useEffect(() => {
    if (!editingProduct || !mapLoaded || map) return;

    setTimeout(() => {
      const mapElement = document.getElementById('edit-map');
      if (!mapElement) return;

      const coords = editingProduct.coordinates || { latitude: 32.0853, longitude: 34.7818 };
      const location = { lat: coords.latitude, lng: coords.longitude };

      const mapInstance = new window.google.maps.Map(mapElement, {
        center: location,
        zoom: 15,
        mapTypeControl: false,
      });

      const markerInstance = new window.google.maps.Marker({
        map: mapInstance,
        draggable: true,
        position: location,
      });

      markerInstance.addListener('dragend', () => {
        const position = markerInstance.getPosition();
        setEditingProduct({
          ...editingProduct,
          coordinates: { latitude: position.lat(), longitude: position.lng() },
        });
      });

      mapInstance.addListener('click', (e) => {
        const position = e.latLng;
        markerInstance.setPosition(position);
        setEditingProduct({
          ...editingProduct,
          coordinates: { latitude: position.lat(), longitude: position.lng() },
        });
      });

      setMap(mapInstance);
      setMarker(markerInstance);
    }, 100);
  }, [editingProduct, mapLoaded, map]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get_products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      setMessage(`Error loading products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct({ ...product });
    setNewImageFiles([]);
    setImagePreviews([]);
    setMap(null);
    setMarker(null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewImageFiles([]);
    setImagePreviews([]);
    setMap(null);
    setMarker(null);
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    const currentTotal = (editingProduct.imageUrls?.length || 0) + newImageFiles.length;
    
    if (currentTotal + files.length > MAX_IMAGES) {
      setMessage(`❌ Maximum ${MAX_IMAGES} images allowed`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setNewImageFiles([...newImageFiles, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const handleRemoveExistingImage = (index) => {
    const newUrls = editingProduct.imageUrls.filter((_, i) => i !== index);
    setEditingProduct({ ...editingProduct, imageUrls: newUrls });
  };

  const handleRemoveNewImage = (index) => {
    const newFiles = newImageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]);
    setNewImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    setMessage('Saving changes...');
    
    try {
      let imageUrls = [...(editingProduct.imageUrls || [])];
      let imagesChanged = newImageFiles.length > 0 || imageUrls.length !== (editingProduct.imageUrls?.length || 0);

      // Upload new images
      for (let i = 0; i < newImageFiles.length; i++) {
        setMessage(`Uploading image ${i + 1} of ${newImageFiles.length}...`);
        const imageIndex = imageUrls.length;
        const imageRef = ref(storage, `images/${editingProduct.id}_${imageIndex}.jpg`);
        await uploadBytes(imageRef, newImageFiles[i]);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }

      const updatedProduct = {
        ...editingProduct,
        imageUrls: imageUrls,
      };

      const response = await fetch(`${API_BASE_URL}/get_products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product: updatedProduct,
          imagesChanged: imagesChanged
        }),
      });

      if (!response.ok) throw new Error('Failed to update product');

      if (imagesChanged) {
        setMessage('✅ Product updated! Embeddings regenerating (~1 min)');
      } else {
        setMessage('✅ Product updated successfully!');
      }
      
      setEditingProduct(null);
      setNewImageFiles([]);
      setImagePreviews([]);
      await fetchProducts();
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const handleDeleteClick = (product) => {
    setDeletingProduct(product);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    setMessage('Deleting product...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/get_products?id=${deletingProduct.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      setMessage('✅ Product deleted successfully!');
      setDeletingProduct(null);
      await fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      setDeletingProduct(null);
    }
  };

  const openGoogleMaps = (coordinates) => {
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      alert('Location not available');
      return;
    }
    const { latitude, longitude } = coordinates;
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="max-w-7xl mx-auto p-8">
    <div className="flex justify-between items-center mb-8">
      <div>
        <Link to="/" className="text-blue-500 hover:underline mb-2 inline-block">
          ← {t('catalog.backToHome')}
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">{t('catalog.title')}</h2>
        <p className="text-gray-600 mt-2">
          {products.length} {t('catalog.count')}
        </p>
      </div>
      <button
        onClick={fetchProducts}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        🔄 {t('catalog.refresh')}
      </button>
    </div>

    {message && (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
        <p className="text-blue-800">{message}</p>
      </div>
    )}

    {loading && (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )}

    {!loading && products.length === 0 && (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-xl text-gray-600 mb-4">{t('catalog.empty')}</p>
        <Link to="/upload">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            {t('catalog.uploadFirst')}
          </button>
        </Link>
      </div>
    )}

    {!loading && products.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all"
          >
            <div className="relative h-48">
              {product.imageUrls && product.imageUrls.length > 0 ? (
                <>
                  <img
                    src={product.imageUrls[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.imageUrls.length > 1 && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      📷 {product.imageUrls.length} {t('catalog.photos')}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl">📷</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{product.title}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {product.description || 'No description'}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>📍 {product.location}</span>
                {product.coordinates && (
                  <button
                    onClick={() => openGoogleMaps(product.coordinates)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    🗺️ {t('result.map')}
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium text-sm"
                >
                  ✏️ {t('catalog.edit')}
                </button>
                <button
                  onClick={() => handleDeleteClick(product)}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium text-sm"
                >
                  🗑️ {t('catalog.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Edit Modal */}
    {editingProduct && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8">
          <div className="p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">✏️ {t('edit.title')}</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('edit.name')} *</label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('edit.description')}</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('edit.images')} ({(editingProduct.imageUrls?.length || 0) + newImageFiles.length}/{MAX_IMAGES})
                </label>

                {editingProduct.imageUrls && editingProduct.imageUrls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">{t('edit.images.current')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {editingProduct.imageUrls.map((url, index) => (
                        <div key={`existing-${index}`} className="relative group">
                          <img
                            src={url}
                            alt={`${editingProduct.title} ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ✕
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {imagePreviews.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-green-600 mb-2">{t('edit.images.new')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative group">
                          <img
                            src={preview}
                            alt={`New ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-green-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ✕
                          </button>
                          <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                            {t('common.new')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {((editingProduct.imageUrls?.length || 0) + newImageFiles.length) < MAX_IMAGES && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddImages}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                )}
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('edit.location')} *</label>
                <input
                  type="text"
                  value={editingProduct.location}
                  onChange={(e) => setEditingProduct({ ...editingProduct, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-3"
                />

                {editingProduct.coordinates && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                    <p className="text-sm text-blue-700">
                      {t('edit.coordinates')} {editingProduct.coordinates.latitude?.toFixed(6)}, {editingProduct.coordinates.longitude?.toFixed(6)}
                    </p>
                  </div>
                )}

                <div id="edit-map" className="w-full h-80 rounded-lg border-2 border-gray-300"></div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                💾 {t('edit.save')}
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                ❌ {t('edit.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Delete Modal */}
    {deletingProduct && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-2">{t('delete.title')}</h3>
            <p className="text-gray-600 mb-4">
              {t('delete.message')} <strong>"{deletingProduct.title}"</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              {t('delete.warning')} {deletingProduct.imageUrls?.length || 0} {t('delete.warningImages')}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
              >
                🗑️ {t('delete.confirm')}
              </button>
              <button
                onClick={() => setDeletingProduct(null)}
                className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition font-medium"
              >
                {t('delete.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default ProductCatalog;
