import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';

function HomePage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Welcome, {auth.currentUser.displayName}!
      </h2>
      <p className="text-gray-600 mb-6">What would you like to do?</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/upload" className="block p-6 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold">⬆️ Upload New Product</h3>
        </Link>
        <Link to="/find" className="block p-6 bg-green-500 text-white text-center rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold">🔍 Find Existing Product</h3>
        </Link>
      </div>
    </div>
  );
}
export default HomePage;