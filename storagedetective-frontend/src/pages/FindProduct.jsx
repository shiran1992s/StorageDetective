import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

function FindProduct() {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [textQuery, setTextQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState('');
  const [searchInfo, setSearchInfo] = useState(null);
  const [lastSearchPayload, setLastSearchPayload] = useState(null);

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

  const performSearch = async (offset = 0, append = false) => {
    const isInitialSearch = offset === 0;
    
    if (isInitialSearch) {
      setLoading(true);
      setMessage('Searching for product...');
      if (!append) setResults([]);
    } else {
      setLoadingMore(true);
    }

    try {
      let payload;
      if (isInitialSearch) {
        payload = { 
          text_query: textQuery,
          num_results: 1,
          offset: 0
        };
        
        if (imageFile) {
          payload.image_base64 = await toBase64(imageFile);
        }
        
        setLastSearchPayload(payload);
      } else {
        payload = {
          ...lastSearchPayload,
          num_results: 3,
          offset: offset
        };
      }
      
      const baseUrl = "https://storage-detective-find-product-agent-325488595361.us-west1.run.app";
      const endpoint = '/find_product';

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Search failed.');
      
      if (append) {
        setResults(prev => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }
      
      setSearchInfo({
        totalMatches: data.total_matches,
        hasMore: data.has_more,
        searchMode: data.search_mode
      });
      
      setMessage(data.message || `Found ${data.total_matches} matching product(s)!`);
      
      if (isInitialSearch) {
        setImageFile(null);
        setPreview('');
        setTextQuery('');
      }
      
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => performSearch(0, false);
  
  const handleLoadMore = () => {
    if (searchInfo && searchInfo.hasMore) {
      performSearch(results.length, true);
    }
  };

  // Helper to get badge color based on match quality
  const getQualityBadge = (quality) => {
    const badges = {
      'excellent': 'bg-green-500 text-white',
      'good': 'bg-blue-500 text-white', 
      'fair': 'bg-yellow-500 text-black',
      'poor': 'bg-red-500 text-white'
    };
    return badges[quality] || badges.fair;
  };

  // Helper to get similarity color - NOW CORRECT: Higher % = Better = Green
  const getSimilarityColor = (percent) => {
    if (percent >= 80) return 'text-green-700 font-bold';
    if (percent >= 65) return 'text-blue-600 font-semibold';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper to get progress bar color
  const getProgressBarColor = (percent) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 65) return 'bg-blue-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">← Back to Home</Link>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Find Product by Image or Description</h2>
        <div className="space-y-4">
          {/* Text input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Description</label>
            <input 
              type="text"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              placeholder="e.g., 'calculator', 'microwave', 'red pot'"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="text-center text-sm text-gray-500 font-semibold">OR</div>

          {/* Image upload */}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {preview && (
            <div className="flex justify-center">
              <img src={preview} alt="Preview" className="w-60 h-60 object-cover rounded-md border" />
            </div>
          )}
          
          <button 
            onClick={handleSearch} 
            disabled={loading || (!imageFile && !textQuery)}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Searching...' : 'Find Product'}
          </button>
        </div>
        
        {message && (
          <div className="mt-4">
            <p className="text-center text-gray-600">{message}</p>
            {searchInfo && searchInfo.searchMode && (
              <p className="text-center text-sm text-gray-500 mt-1">
                Search mode: {searchInfo.searchMode === 'image' ? '📷 Visual similarity' : '📝 Text matching'}
              </p>
            )}
          </div>
        )}
      </div>
      
      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">
            Search Results ({results.length}{searchInfo && searchInfo.totalMatches > results.length ? ` of ${searchInfo.totalMatches}` : ''})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item, index) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-300">
                {/* Best Match Badge */}
                {index === 0 && (
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs font-bold px-3 py-2 text-center">
                    🏆 BEST MATCH
                  </div>
                )}
                
                {/* Product Image */}
                <div className="relative">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                  {/* Quality Badge on Image */}
                  <span className={`absolute top-2 right-2 text-xs px-3 py-1 rounded-full font-bold shadow-lg ${getQualityBadge(item.match_quality)}`}>
                    {item.match_quality.toUpperCase()}
                  </span>
                </div>
                
                {/* Product Info */}
                <div className="p-4">
                  <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">📍 {item.location}</p>
                  {item.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
                  )}
                  
                  {/* Similarity Score Section */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-medium">
                        {item.search_mode === 'text' ? 'Relevance Score' : 'Similarity Score'}
                      </span>
                      <span className={`text-2xl font-bold ${getSimilarityColor(item.similarity_percentage)}`}>
                        {item.similarity_percentage}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(item.similarity_percentage)}`}
                        style={{width: `${item.similarity_percentage}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More Button */}
          {searchInfo && searchInfo.hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition font-medium"
              >
                {loadingMore ? 'Loading...' : `Load More (${searchInfo.totalMatches - results.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FindProduct;
