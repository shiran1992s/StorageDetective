import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CameraCapture = ({ onPhotosCapture, maxPhotos = 10, language = 'en', onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState('');

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(language === 'he' ? 'שגיאה בגישה למצלמה. אנא אשר הרשאות מצלמה.' : 'Error accessing camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const preview = URL.createObjectURL(blob);
          
          const newPhotos = [...capturedPhotos, { file, preview }];
          setCapturedPhotos(newPhotos);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => startCamera(), 100);
  };

  const removePhoto = (index) => {
    URL.revokeObjectURL(capturedPhotos[index].preview);
    const newPhotos = capturedPhotos.filter((_, i) => i !== index);
    setCapturedPhotos(newPhotos);
  };

  const handleDone = () => {
    onPhotosCapture(capturedPhotos.map(p => p.file));
    stopCamera();
    capturedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setCapturedPhotos([]);
  };

  const handleCancel = () => {
    capturedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setCapturedPhotos([]);
    stopCamera();
    if (onClose) onClose();
  };

  useEffect(() => {
    return () => {
      stopCamera();
      capturedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
    };
  }, []);

  const cameraUI = (
    <div 
      className="fixed inset-0 bg-black flex flex-col"
      style={{ zIndex: 9999 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center flex-shrink-0">
        <button
          type="button"
          onClick={handleCancel}
          className="text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition active:bg-gray-700"
        >
          ✕ {language === 'he' ? 'ביטול' : 'Cancel'}
        </button>
        <div className="text-white font-bold">
          {language === 'he' ? `${capturedPhotos.length}/${maxPhotos} תמונות` : `${capturedPhotos.length}/${maxPhotos} Photos`}
        </div>
        <button
          type="button"
          onClick={handleDone}
          disabled={capturedPhotos.length === 0}
          className="text-white px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 transition font-medium active:bg-blue-800"
        >
          ✓ {language === 'he' ? 'סיום' : 'Done'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-3 text-center flex-shrink-0">
          {error}
        </div>
      )}

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {!isActive ? (
          <button
            type="button"
            onClick={startCamera}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg text-xl font-bold hover:bg-blue-700 transition active:bg-blue-800"
          >
            📸 {language === 'he' ? 'פתח מצלמה' : 'Start Camera'}
          </button>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </div>

      {/* Controls */}
      {isActive && (
        <div className="bg-gray-900 p-6 flex flex-col items-center gap-4 flex-shrink-0">
          {/* Thumbnail Strip */}
          {capturedPhotos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto max-w-full pb-2 w-full justify-center">
              {capturedPhotos.map((photo, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={photo.preview}
                    alt={`Captured ${index + 1}`}
                    className="w-16 h-16 object-cover rounded border-2 border-green-500"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 active:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Capture Button */}
          <div className="flex items-center justify-center gap-8 w-full">
            <button
              type="button"
              onClick={switchCamera}
              className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl hover:bg-gray-600 transition active:bg-gray-500"
            >
              🔄
            </button>
            
            <button
              type="button"
              onClick={capturePhoto}
              disabled={capturedPhotos.length >= maxPhotos}
              className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center active:scale-95"
            >
              <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-400"></div>
            </button>

            <div className="w-12 h-12"></div>
          </div>

          <p className="text-white text-sm text-center">
            {language === 'he' 
              ? capturedPhotos.length >= maxPhotos ? 'הגעת למקסימום תמונות' : 'לחץ על הכפתור הלבן כדי לצלם'
              : capturedPhotos.length >= maxPhotos ? 'Maximum photos reached' : 'Tap white button to capture'
            }
          </p>
        </div>
      )}
    </div>
  );

  return createPortal(cameraUI, document.body);
};

export default CameraCapture;
