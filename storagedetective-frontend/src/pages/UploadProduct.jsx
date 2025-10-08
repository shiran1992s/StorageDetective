import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

const GOOGLE_MAPS_API_KEY = 'AIzaSyA54LyFjvVof2S3qvnTRrtXgFQg_TSp7hw';
const MAX_IMAGES = 10;

function isIOS() {
  return (
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream
  );
}

export default function UploadProduct() {
  const { t, language } = useLanguage();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(''); // Manual editable location field
  const [coordinates, setCoordinates] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // Load Google Maps
  useEffect(() => {
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
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || map) return;

    const defaultLocation = { lat: 32.0853, lng: 34.7818 }; // Tel Aviv
    const mapInstance = new window.google.maps.Map(document.getElementById('map'), {
      center: defaultLocation,
      zoom: 13,
      mapTypeControl: false,
      gestureHandling: 'greedy', // Better mobile experience
    });

    const markerInstance = new window.google.maps.Marker({
      map: mapInstance,
      draggable: true,
      position: defaultLocation,
      animation: window.google.maps.Animation.DROP,
    });

    // When marker is dragged
    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition();
      const lat = position.lat();
      const lng = position.lng();
      setCoordinates({ lat, lng });
      reverseGeocode(lat, lng);
    });

    // When map is clicked (for desktop and mobile tap)
    mapInstance.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      markerInstance.setPosition(e.latLng);
      markerInstance.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => markerInstance.setAnimation(null), 750);
      setCoordinates({ lat, lng });
      reverseGeocode(lat, lng);
    });

    // Google Maps Places search box
    const input = document.getElementById('google-maps-search');
    const searchBox = new window.google.maps.places.SearchBox(input);
    
    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (places.length === 0) return;
      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;
      
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      markerInstance.setPosition(place.geometry.location);
      markerInstance.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => markerInstance.setAnimation(null), 750);
      mapInstance.setCenter(place.geometry.location);
      mapInstance.setZoom(17);
      
      setCoordinates({ lat, lng });
      setLocation(place.formatted_address || place.name);
    });

    setMap(mapInstance);
    setMarker(markerInstance);
  }, [mapLoaded, map]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setLocation(results[0].formatted_address);
        }
      });
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage(language === 'he' ? 'הדפדפן שלך לא תומך בשירותי מיקום' : 'Your browser does not support location services');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setMessage(language === 'he' ? 'מאתר את המיקום שלך...' : 'Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setCoordinates({ lat, lng });
        
        if (marker && map) {
          const newPosition = { lat, lng };
          marker.setPosition(newPosition);
          marker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => marker.setAnimation(null), 750);
          map.setCenter(newPosition);
          map.setZoom(17);
          
          // Get address for this location
          reverseGeocode(lat, lng);
        }
        
        setMessage(language === 'he' ? '✓ מיקום נמצא' : '✓ Location found');
        setTimeout(() => setMessage(''), 2000);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = language === 'he' ? 'לא ניתן לאתר את המיקום שלך' : 'Could not get your location';
        
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = language === 'he' ? 'אנא אשר הרשאות מיקום בדפדפן' : 'Please allow location permissions in your browser';
        }
        
        setMessage(`❌ ${errorMsg}`);
        setTimeout(() => setMessage(''), 4000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName || imageFiles.length === 0 || !location || !coordinates) {
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
          description: description,
          productLocation: location,
          coordinates: {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
          },
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
      setDescription('');
      setLocation('');
      setCoordinates(null);
      setImageFiles([]);
      setImagePreviews([]);
      
      if (marker && map) {
        const defaultLocation = { lat: 32.0853, lng: 34.7818 };
        marker.setPosition(defaultLocation);
        map.setCenter(defaultLocation);
        map.setZoom(13);
      }

      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(`❌ ${t('common.error')}: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
        ← {t('upload.backToHome')}
      </Link>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">{t('upload.title')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('upload.name')} *
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t('upload.name.placeholder')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('upload.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('upload.description.placeholder')}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Location Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('upload.location')} * 
              <span className="text-xs text-gray-500 ml-2">
                ({language === 'he' ? 'חפש, השתמש במיקום נוכחי או לחץ על המפה' : 'Search, use current location, or click on map'})
              </span>
            </label>
            
            {/* Manual Location Text Input (Editable) */}
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={language === 'he' ? 'הזן שם מיקום או כתובת' : 'Enter location name or address'}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md mb-3 focus:ring-indigo-500 focus:border-indigo-500"
            />

            {/* Google Maps Search Box (Separate) */}
            <input
              id="google-maps-search"
              type="text"
              placeholder={language === 'he' ? 'חפש מקום במפה...' : 'Search place on map...'}
              className="block w-full px-3 py-2 border border-blue-300 rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
            />
            
            {/* Current Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="mb-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm font-medium"
            >
              📍 {t('upload.location.current')}
            </button>

            {/* Selected Location Display */}
            {location && coordinates && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-3">
                <p className="text-sm font-medium text-blue-900">{t('upload.location.selected')}</p>
                <p className="text-sm text-blue-700 font-semibold">{location}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {t('upload.location.coordinates')}: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              </div>
            )}

            {/* Map */}
            <div id="map" className="w-full h-96 rounded-md border-2 border-gray-300"></div>
            <p className="text-xs text-gray-500 mt-1">
              💡 {language === 'he' ? 'גרור את הסיכה, לחץ על המפה או חפש מקום' : 'Drag the pin, click on map, or search for a place'}
            </p>
          </div>

          {/* Multi-Image Input */}
		<div>
		  <label className="block text-sm font-medium text-gray-700 mb-2">
			{t('upload.images')} ({imageFiles.length}/{MAX_IMAGES})
		  </label>
		  
		  {imageFiles.length < MAX_IMAGES && (
			isIOS() ? (
			  <div className="space-y-3">
				{/* iOS: Camera Button */}
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
					📸 {language === 'he' ? 'צלם תמונות חדשות' : 'Take New Photos'}
				  </div>
				  <p className="text-xs text-center text-gray-500 mt-1">
					{language === 'he'
					  ? 'פתח מצלמה וצלם עד 10 תמונות'
					  : 'Open camera and take up to 10 photos'}
				  </p>
				</label>

				{/* iOS: Photo Library Button (NO capture attribute) */}
				<label className="block w-full cursor-pointer">
				  <input
					type="file"
					accept="image/*"
					multiple
					onChange={handleMultiPhotoInput}
					className="hidden"
				  />
				  <div className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center flex items-center justify-center gap-2">
					🖼️ {language === 'he' ? 'בחר מהספרייה' : 'Choose from Library'}
				  </div>
				  <p className="text-xs text-center text-gray-500 mt-1">
					{language === 'he'
					  ? 'בחר עד 10 תמונות קיימות מהגלריה'
					  : 'Select up to 10 existing photos from your gallery'}
				  </p>
				</label>
			  </div>
			) : (
			  <div className="space-y-3">
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
					📸 {language === 'he' ? 'צלם תמונות' : 'Take Photos'}
				  </div>
				</label>
				<label className="block w-full cursor-pointer">
				  <input
					type="file"
					accept="image/*"
					multiple
					onChange={handleMultiPhotoInput}
					className="hidden"
				  />
				  <div className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center flex items-center justify-center gap-2">
					🖼️ {language === 'he' ? 'בחר תמונות מהגלריה' : 'Choose from Gallery'}
				  </div>
				</label>
			  </div>
			)
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

		  <p className="text-xs text-gray-500 mt-2">
			💡 {t('upload.images.hint')}
		  </p>
		</div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
          >
            {uploading ? t('upload.button.uploading') : `${t('upload.button')} ${imageFiles.length > 0 ? `(${imageFiles.length})` : ''}`}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-gray-700 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
