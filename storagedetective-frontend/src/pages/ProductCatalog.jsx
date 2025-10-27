import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = 'https://storage-detective-get-products-325488595361.us-west1.run.app';
const MAX_IMAGES = 10;

function ProductCatalog() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedGallery, setExpandedGallery] = useState(null);
  
  // Edit form states
  const [editName, setEditName] = useState('');
  const [editCatalogNumber, setEditCatalogNumber] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get_products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditName(product.title);
    setEditCatalogNumber(product.catalogNumber || '');
    setEditDescription(product.description || '');
    setEditImages(product.imageUrls || []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
  };

  const handleAddNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const totalImages = editImages.length + newImageFiles.length + files.length;
    if (totalImages > MAX_IMAGES) {
      alert(`${t('upload.maxImages')}. ${language === 'he' ? `אפשר להוסיף עוד ${MAX_IMAGES - (editImages.length + newImageFiles.length)}` : `You can add ${MAX_IMAGES - (editImages.length + newImageFiles.length)} more.`}`);
      return;
    }

    setNewImageFiles([...newImageFiles, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...previews]);
  };

  const handleRemoveExistingImage = (index) => {
    setEditImages(editImages.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editName) {
      alert(t('upload.error'));
      return;
    }

    setSaving(true);
    try {
      const productId = editingProduct.id;
      let finalImageUrls = [...editImages];

      // Upload new images
      if (newImageFiles.length > 0) {
        for (let i = 0; i < newImageFiles.length; i++) {
          const imageIndex = finalImageUrls.length;
          const imageRef = ref(storage, `images/${productId}_${imageIndex}.jpg`);
          await uploadBytes(imageRef, newImageFiles[i]);
          const imageUrl = await getDownloadURL(imageRef);
          finalImageUrls.push(imageUrl);
        }
      }

      const imagesChanged = newImageFiles.length > 0 || finalImageUrls.length !== editingProduct.imageUrls.length;

      const updatedProduct = {
        id: productId,
        title: editName,
        catalogNumber: editCatalogNumber,
        description: editDescription,
        imageUrls: finalImageUrls
      };

      const response = await fetch(`${API_BASE_URL}/get_products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: updatedProduct,
          imagesChanged: imagesChanged
        })
      });

      if (!response.ok) throw new Error('Update failed');

      alert(imagesChanged ? t('edit.successWithEmbeddings') : t('edit.success'));
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      alert(`${t('common.error')}: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get_products?id=${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');

      alert(language === 'he' ? 'המוצר נמחק בהצלחה!' : 'Product deleted successfully!');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      alert(`${t('common.error')}: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <Link to="/home" className="text-blue-500 hover:underline mb-4 inline-block">
        ← {t('catalog.backToHome')}
      </Link>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          {t('catalog.title')} ({products.length} {t('catalog.count')})
        </h2>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🔄 {t('catalog.refresh')}
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-xl text-gray-600 mb-4">{t('catalog.empty')}</p>
          <Link to="/upload">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              {t('catalog.uploadFirst')}
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all"
            >
              {/* Image */}
              <div 
                className="relative h-48 cursor-pointer"
                onClick={() => setExpandedGallery(product)}
              >
                {product.imageUrl ? (
                  <>
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {product.imageUrls && product.imageUrls.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
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

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{product.title}</h3>
                
                {/* Catalog Number */}
                {product.catalogNumber && product.catalogNumber !== 'N/A' && (
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">{t('result.catalogNumber')}:</span> {product.catalogNumber}
                  </div>
                )}

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description || 'No description'}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                  >
                    ✏️ {t('catalog.edit')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(product)}
                    className="flex-1 py-2 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-2xl font-bold mb-4">{t('edit.title')}</h3>

            {/* Product Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('edit.name')} *
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Catalog Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('edit.catalogNumber')} <span className="text-gray-400 text-xs">({t('upload.optional')})</span>
              </label>
              <input
                type="text"
                value={editCatalogNumber}
                onChange={(e) => setEditCatalogNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('edit.description')} <span className="text-gray-400 text-xs">({t('upload.optional')})</span>
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Images */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('edit.images')} ({editImages.length + newImageFiles.length}/{MAX_IMAGES})
              </label>

              {/* Existing Images */}
              {editImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{t('edit.images.current')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {editImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Current ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {newImagePreviews.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{t('edit.images.new')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-24 object-cover rounded border-2 border-green-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Images Button */}
              {(editImages.length + newImageFiles.length) < MAX_IMAGES && (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddNewImages}
                    className="hidden"
                  />
                  <div className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-center">
                    📸 {language === 'he' ? 'הוסף תמונות' : 'Add Images'}
                  </div>
                </label>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {saving ? t('edit.saving') : t('edit.save')}
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                {t('edit.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{t('delete.title')}</h3>
            <p className="text-gray-700 mb-4">
              {t('delete.message')} "<strong>{deleteConfirm.title}</strong>"?
            </p>
            <p className="text-red-600 text-sm mb-6">
              {t('delete.warning')} {deleteConfirm.imageUrls?.length || 1} {t('delete.warningImages')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                {t('delete.confirm')}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                {t('delete.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {expandedGallery && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setExpandedGallery(null)}
        >
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-2xl font-bold">{expandedGallery.title}</h3>
              <button
                onClick={() => setExpandedGallery(null)}
                className="text-white text-3xl hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            {expandedGallery.imageUrls && expandedGallery.imageUrls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expandedGallery.imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`${expandedGallery.title} ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <img
                src={expandedGallery.imageUrl}
                alt={expandedGallery.title}
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductCatalog;
