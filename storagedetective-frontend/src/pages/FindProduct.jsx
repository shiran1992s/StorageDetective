import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

function FindProduct() {
  const { t, language } = useLanguage();
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [textQuery, setTextQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchInfo, setSearchInfo] = useState(null);
  const [expandedImageGallery, setExpandedImageGallery] = useState(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setResults([]);
      setMessage('');
      setSearchInfo(null);
    }
  };

  const performSearch = async () => {
    if (!imageFile && !textQuery.trim()) {
      setMessage(t('upload.error'));
      return;
    }

    setLoading(true);
    setMessage(t('find.searching'));
    setResults([]);

    try {
      let payload = { 
        text_query: textQuery,
        num_results: 20,
        offset: 0
      };
      
      if (imageFile) {
        payload.image_base64 = await toBase64(imageFile);
      }
      
      const baseUrl = "https://storage-detective-find-product-agent-325488595361.us-west1.run.app";
      const response = await fetch(`${baseUrl}/find_product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Search failed');
      
      setResults(data.results);
      setSearchInfo({
        totalMatches: data.total_matches,
        searchMode: data.search_mode
      });
      
      setMessage(data.message || `${t('find.results')} ${data.results.length}`);
      
    } catch (error) {
      setMessage(`${t('common.error')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getQualityBadge = (quality) => {
    const badges = {
      'excellent': 'bg-green-500 text-white',
      'good': 'bg-blue-500 text-white',
      'fair': 'bg-yellow-500 text-white',
      'poor': 'bg-red-500 text-white'
    };
    return badges[quality] || 'bg-gray-500 text-white';
  };

  const handleEditProduct = (productId) => {
    navigate('/catalog', { state: { editProductId: productId } });
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Link to="/home" className="text-blue-500 hover:underline mb-4 inline-block">
        ← {t('find.backToHome')}
      </Link>

      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-6">{t('find.title')}</h2>

        {/* Text Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('find.textQuery')}
          </label>
          <input
            type="text"
            value={textQuery}
            onChange={(e) => setTextQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="text-center text-gray-500 mb-6">{t('find.or')}</div>

        {/* Image Upload - UNIVERSAL APPROACH */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('find.uploadImage')}
          </label>
          
          <div className="space-y-3">
            {/* Camera Button */}
            <label className="block w-full cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-center flex items-center justify-center gap-2">
                📸 {t('find.takePhoto')}
              </div>
            </label>

            {/* Gallery Button */}
            <label className="block w-full cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center flex items-center justify-center gap-2">
                🖼️ {t('find.chooseFromGallery')}
              </div>
            </label>
          </div>

          {preview && (
            <div className="mt-4 flex justify-center">
              <img
                src={preview}
                alt="Preview"
                className="w-60 h-60 object-cover rounded-md border"
              />
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={performSearch}
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
        >
          {loading ? t('find.searching') : `🔍 ${t('find.button')}`}
        </button>

        {message && (
          <p className="mt-4 text-center text-gray-700 font-medium">{message}</p>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              {t('find.results')} ({results.length})
            </h3>
            {searchInfo && (
              <p className="text-sm text-gray-600 mt-1">
                {t('find.searchMode')}: <span className="font-semibold">{searchInfo.searchMode}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item, index) => (
              <div 
                key={item.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-300"
              >
                {/* Badge */}
                {index === 0 && (
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-center py-2 font-bold">
                    🏆 {t('result.bestMatch')}
                  </div>
                )}

                {/* Low Confidence Warning */}
                {item.is_low_confidence && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <p className="text-xs text-yellow-800 font-medium">
                      ⚠️ {language === 'he' 
                        ? 'לא נמצאו התאמות מדויקות. מציג תוצאה הכי קרובה.' 
                        : 'No close matches found. Showing best available result.'}
                    </p>
                  </div>
                )}

                {/* Image with Gallery Indicator */}
                <div className="relative h-48 cursor-pointer" onClick={() => setExpandedImageGallery(item)}>
                  {item.imageUrl ? (
                    <>
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {item.imageUrls && item.imageUrls.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          📷 {item.imageUrls.length} {t('catalog.photos')}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">📷</span>
                    </div>
                  )}
                  
                  {/* Quality Badge */}
                  <div className={`absolute top-2 left-2 px-3 py-1 rounded-full font-bold text-xs ${getQualityBadge(item.match_quality)}`}>
                    {t(`result.quality.${item.match_quality}`)}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                  
                  {/* Catalog Number */}
                  {item.catalogNumber && item.catalogNumber !== 'N/A' && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t('result.catalogNumber')}:</span> {item.catalogNumber}
                    </div>
                  )}

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description || 'No description'}
                  </p>

                  {/* Similarity Score */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{t('result.similarity')}</span>
                      <span className={`font-bold ${
                        item.similarity_percentage >= 70 ? 'text-green-600' :
                        item.similarity_percentage >= 50 ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {item.similarity_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.similarity_percentage >= 70 ? 'bg-green-500' :
                          item.similarity_percentage >= 50 ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${item.similarity_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditProduct(item.id)}
                    className="w-full py-2 px-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium text-sm"
                  >
                    ✏️ {t('result.edit')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {expandedImageGallery && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setExpandedImageGallery(null)}
        >
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-2xl font-bold">{expandedImageGallery.title}</h3>
              <button
                onClick={() => setExpandedImageGallery(null)}
                className="text-white text-3xl hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            {/* Image Grid */}
            {expandedImageGallery.imageUrls && expandedImageGallery.imageUrls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expandedImageGallery.imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`${expandedImageGallery.title} ${index + 1}`}
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
                src={expandedImageGallery.imageUrl}
                alt={expandedImageGallery.title}
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FindProduct;
