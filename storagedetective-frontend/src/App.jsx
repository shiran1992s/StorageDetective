import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

import MainPage from './pages/MainPage';
import UploadProduct from './pages/UploadProduct';
import FindProduct from './pages/FindProduct';
import ProductCatalog from './pages/ProductCatalog';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      <header className="bg-white shadow-lg border-b-2 border-blue-100">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔍</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t('app.title')}</h1>
              <p className="text-xs text-gray-500">{t('app.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-md font-medium flex items-center gap-2"
              title={language === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
            >
              <span className="text-lg">{language === 'en' ? '🇮🇱' : '🇺🇸'}</span>
              <span>{language === 'en' ? 'עברית' : 'English'}</span>
            </button>

            {user && (
              <>
                <div className={`text-right hidden md:block ${language === 'he' ? 'text-left' : ''}`}>
                  <p className="text-sm font-medium text-gray-700">{user.displayName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-blue-200"
                  />
                )}
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all transform hover:scale-105 shadow-md font-medium"
                >
                  {t('app.logout')}
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!user ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white p-12 rounded-2xl shadow-2xl text-center max-w-md mx-auto border-2 border-blue-100">
              <div className="text-6xl mb-6">🔐</div>
              <h2 className="text-3xl font-bold mb-2 text-gray-800">{t('login.welcome')}</h2>
              <p className="text-gray-600 mb-8">{t('login.subtitle')}</p>
              <button 
                onClick={handleLogin} 
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 font-semibold text-lg"
              >
                <svg className="w-6 h-6" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                {t('login.button')}
              </button>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/upload" element={<UploadProduct />} />
            <Route path="/find" element={<FindProduct />} />
            <Route path="/catalog" element={<ProductCatalog />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </main>

      {user && (
        <footer className="bg-white border-t-2 border-blue-100 mt-12">
          <div className="container mx-auto px-6 py-6 text-center">
            <p className="text-sm text-gray-600">
              Powered by <span className="font-semibold text-blue-600">Google Cloud Vertex AI</span> • Vector Search • Firebase
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Made with ❤️ for efficient storage management
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App;
