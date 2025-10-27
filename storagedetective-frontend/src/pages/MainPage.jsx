import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = 'https://storage-detective-get-products-325488595361.us-west1.run.app';

function MainPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const [stats, setStats] = useState({ totalProducts: 0, totalImages: 0, loading: true });
  const [menuOpen, setMenuOpen] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get_products`);
      const data = await response.json();
      const products = data.products || [];
      const totalImages = products.reduce((sum, product) => {
        return sum + (product.imageUrls?.length || 0);
      }, 0);

      setStats({
        totalProducts: products.length,
        totalImages: totalImages,
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({ totalProducts: 0, totalImages: 0, loading: false });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with Hamburger Menu */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-4 top-16 bg-white shadow-lg rounded-lg border border-gray-200 w-64 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition text-left"
              >
                <span className="text-xl">🌐</span>
                <span>{t('app.language')}: {language === 'en' ? 'English' : 'עברית'}</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 rounded-lg transition text-left mt-1"
              >
                <span className="text-xl">🚪</span>
                <span>{t('app.logout')}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Subtitle */}
        <p className="text-center text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
          {t('home.subtitle')}
        </p>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link to="/upload" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 h-full">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📤</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('home.upload.title')}</h3>
              <p className="text-gray-600">{t('home.upload.description')}</p>
            </div>
          </Link>

          <Link to="/find" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500 h-full">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('home.find.title')}</h3>
              <p className="text-gray-600">{t('home.find.description')}</p>
            </div>
          </Link>

          <Link to="/catalog" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 h-full">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📚</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('home.catalog.title')}</h3>
              <p className="text-gray-600">{t('home.catalog.description')}</p>
            </div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">{t('home.stats.title')}</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {stats.loading ? '...' : stats.totalProducts}
              </div>
              <div className="text-blue-100">{t('home.stats.items')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {stats.loading ? '...' : stats.totalImages}
              </div>
              <div className="text-blue-100">{t('home.stats.photos')}</div>
            </div>
          </div>
        </div>

        {/* Elegant Features Showcase - COMPLETELY REDESIGNED */}
        <div className="mt-16 mb-8">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest text-gray-500 mb-3">
              {language === 'en' ? 'POWERED BY' : 'מופעל על ידי'}
            </p>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {language === 'en' ? 'Advanced Technology' : 'טכנולוגיה מתקדמת'}
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mb-8"></div>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Feature 1 - Horizontal Layout */}
            <div className="flex items-center gap-6 p-6 bg-white/40 backdrop-blur-sm rounded-2xl border-l-4 border-blue-500">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-3xl shadow-lg">
                🤖
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{t('features.ai.title')}</h3>
                <p className="text-gray-600 leading-relaxed">{t('features.ai.description')}</p>
              </div>
            </div>

            {/* Feature 2 - Horizontal Layout */}
            <div className="flex items-center gap-6 p-6 bg-white/40 backdrop-blur-sm rounded-2xl border-l-4 border-purple-500">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-3xl shadow-lg">
                📸
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{t('features.multiimage.title')}</h3>
                <p className="text-gray-600 leading-relaxed">{t('features.multiimage.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
