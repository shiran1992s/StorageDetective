import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

const MAX_IMAGES = 10;

export default function UploadProduct() {
  const { t, language } = useLanguage();
  const [productName, setProductName] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMultiPhotoInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (imageFiles.length + files.length > MAX_IMAGES) {
      setMessage(`❌ ${t('upload.maxImages')}. ${language === 'he' ? `אפשר להוסיף עוד ${MAX_IMAGES - imageFiles.length}` : `You can add ${MAX_IMAGES - imageFiles.length} more.`}`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    const newPreviews = [...imagePreviews];
    files.forEach(file => {
      newPreviews.push(URL.createObjectURL(file));
    });
    setImagePreviews(newPreviews);
    
    setMessage(`✅ ${files.length} ${language === 'he' ? 'תמונות נוספו' : 'photos added'}`);
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName || imageFiles.length === 0) {
      setMessage(t('upload.error'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setUploading(true);
    setMessage(`${language === 'he' ? 'מעלה מוצר עם' : 'Uploading product with'} ${imageFiles.length} ${language === 'he' ? 'תמונות' : 'image(s)'}...`);

    try {
      const productId = uuidv4();
      const imageUrls = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        setMessage(`${language === 'he' ? 'מעלה תמונה' : 'Uploading image'} ${i + 1} ${language === 'he' ? 'מתוך' : 'of'} ${imageFiles.length}...`);
        const imageRef = ref(storage, `images/${productId}_${i}.jpg`);
        await uploadBytes(imageRef, imageFiles[i]);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }

      const productData = {
        id: productId,
        structData: {
          internalId: productId,
          title: productName,
          catalogNumber: catalogNumber || 'N/A',
          description: description || 'No description',
          images: imageUrls.map(url => ({ uri: url })),
          categories: [],
          available_time: new Date().toISOString(),
        },
      };

      setMessage(language === 'he' ? 'שומר מטא-דאטה...' : 'Saving product metadata...');
      const jsonBlob = new Blob([JSON.stringify(productData, null, 2)], {
        type: 'application/json',
      });
      const jsonRef = ref(storage, `json/${productId}.json`);
      await uploadBytes(jsonRef, jsonBlob);

      setMessage(`✅ ${language === 'he' ? `מוצר הועלה עם ${imageFiles.length} תמונות! ההטמעה תיווצר אוטומטית` : `Product uploaded with ${imageFiles.length} images! Embedding will be generated automatically.`}`);
      
      // Reset form
      setProductName('');
      setCatalogNumber('');
      setDescription('');
      setImageFiles([]);
      setImagePreviews([]);

      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(`❌ ${t('common.error')}: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link to="/home" className="text-blue-500 hover:underline mb-4 inline-block">
        ← {t('upload.backToHome')}
      </Link>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">{t('upload.title')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('upload.name')} *
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Catalog Number - OPTIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('upload.catalogNumber')} <span className="text-gray-400 text-xs">({t('upload.optional')})</span>
            </label>
            <input
              type="text"
              value={catalogNumber}
              onChange={(e) => setCatalogNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Description - OPTIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('upload.description')} <span className="text-gray-400 text-xs">({t('upload.optional')})</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Multi-Image Input - UNIVERSAL APPROACH */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('upload.images')} ({imageFiles.length}/{MAX_IMAGES}) *
            </label>
            
            {imageFiles.length < MAX_IMAGES && (
              <div className="space-y-3">
                {/* Camera Button - Works on ALL devices */}
                <label className="block w-full cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handleMultiPhotoInput}
                    className="hidden"
                  />
                  <div className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-center flex items-center justify-center gap-2">
                    📸 {t('upload.takePhoto')}
                  </div>
                </label>

                {/* Gallery Button - Works on ALL devices */}
                <label className="block w-full cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultiPhotoInput}
                    className="hidden"
                  />
                  <div className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center flex items-center justify-center gap-2">
                    🖼️ {t('upload.chooseFromGallery')}
                  </div>
                </label>
              </div>
            )}

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-green-700">
                    ✓ {language === 'he' ? `${imagePreviews.length} תמונות נבחרו` : `${imagePreviews.length} photos selected`}
                  </p>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    {language === 'he' ? 'נקה הכל' : 'Clear All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
          >
            {uploading ? (language === 'he' ? 'מעלה...' : 'Uploading...') : `${t('upload.button')} ${imageFiles.length > 0 ? `(${imageFiles.length})` : ''}`}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-gray-700 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
