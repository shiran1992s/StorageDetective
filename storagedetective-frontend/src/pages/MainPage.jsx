import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = 'https://storage-detective-get-products-325488595361.us-west1.run.app';

function MainPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalImages: 0,
    loading: true
  });

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h2 className="text-5xl font-bold text-gray-800 mb-4">
          {t('home.welcome')}, <span className="text-blue-600">{auth.currentUser?.displayName?.split(' ')[0] || 'User'}!</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('home.subtitle')}
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Upload Card */}
        <Link to="/upload">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-400 group">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-center">
              <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform">📤</div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('home.upload.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('home.upload.description')}
              </p>
            </div>
          </div>
        </Link>

        {/* Find Card */}
        <Link to="/find">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer overflow-hidden border-2 border-transparent hover:border-green-400 group">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-center">
              <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform">🔎</div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('home.find.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('home.find.description')}
              </p>
            </div>
          </div>
        </Link>

        {/* Catalog Card */}
        <Link to="/catalog">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer overflow-hidden border-2 border-transparent hover:border-purple-400 group">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-center">
              <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform">📦</div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('home.catalog.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('home.catalog.description')}
              </p>
            </div>
          </div>
        </Link>

        {/* Stats Card - NON-CLICKABLE */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-orange-200">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-center">
            <div className="text-6xl mb-2">📊</div>
          </div>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('home.stats.title')}</h3>
            {stats.loading ? (
              <div className="space-y-2 text-sm">
                <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('home.stats.items')}:</span>
                  <span className="font-bold text-2xl text-orange-600">{stats.totalProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('home.stats.photos')}:</span>
                  <span className="font-bold text-xl text-orange-600">{stats.totalImages}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-600">{t('home.stats.storage')}:</span>
                  <span className="font-bold text-green-600">✓ {t('home.stats.active')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('features.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="text-4xl mb-3">🤖</div>
            <h4 className="font-bold text-gray-800 mb-2">{t('features.ai.title')}</h4>
            <p className="text-sm text-gray-600">
              {t('features.ai.description')}
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-3">📍</div>
            <h4 className="font-bold text-gray-800 mb-2">{t('features.location.title')}</h4>
            <p className="text-sm text-gray-600">
              {t('features.location.description')}
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-3">📸</div>
            <h4 className="font-bold text-gray-800 mb-2">{t('features.multiimage.title')}</h4>
            <p className="text-sm text-gray-600">
              {t('features.multiimage.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💡</span> {t('tips.title')}
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>{t('tips.photos')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>{t('tips.location')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>{t('tips.multiple')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>{t('tips.map')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default MainPage;
