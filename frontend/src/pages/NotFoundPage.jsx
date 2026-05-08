import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Home, Search, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 relative overflow-hidden flex items-center justify-center">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large background circles */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-300/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gray-200/30 rounded-full blur-2xl"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 right-1/4 w-6 h-6 bg-orange-400/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-1/3 w-4 h-4 bg-orange-500/30 rounded-square rotate-45 animate-bounce"></div>
        <div className="absolute top-1/3 right-1/3 w-8 h-8 border-2 border-orange-300/40 rounded-full animate-pulse"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 text-center relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-black flex items-center justify-center shadow-lg">
                <Car size={32} className="text-white" />
              </div>
              <span className="text-4xl font-display font-bold text-black">
                Drive<span className="text-orange-500">Drip</span>
              </span>
            </div>
          </div>

          {/* 404 Error */}
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-display font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-black mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 max-w-lg mx-auto mb-8">
              Looks like you've taken a wrong turn. The page you're looking for doesn't exist 
              or may have been moved to a different location.
            </p>
          </div>

          {/* Illustration */}
          <div className="mb-12">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-xl border border-white/30">
              <div className="text-6xl mb-4">🚗💨</div>
              <p className="text-gray-600">
                Don't worry, even the best drivers take wrong turns sometimes!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/home"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </Link>
            
            <Link
              to="/parts"
              className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 font-medium"
            >
              <Search className="w-5 h-5" />
              <span>Browse Parts</span>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-900 hover:scale-105 transition-all duration-300 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4">
              Popular Pages
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/parts"
                className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group border border-white/30"
              >
                <Search className="w-6 h-6 text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-black">
                  Spare Parts
                </p>
              </Link>
              
              <Link
                to="/shops"
                className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group border border-white/30"
              >
                <Car className="w-6 h-6 text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-black">
                  Auto Shops
                </p>
              </Link>
              
              <Link
                to="/login"
                className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group border border-white/30"
              >
                <div className="w-6 h-6 bg-orange-500 rounded-full mx-auto mb-2 group-hover:scale-110 transition-transform"></div>
                <p className="text-sm font-medium text-black">
                  Sign In
                </p>
              </Link>
              
              <Link
                to="/register"
                className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group border border-white/30"
              >
                <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2 group-hover:scale-110 transition-transform"></div>
                <p className="text-sm font-medium text-black">
                  Register
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
