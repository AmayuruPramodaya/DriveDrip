import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCart } from '../../contexts/CartContext';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { 
  UserCircle, 
  LogOut, 
  Menu, 
  X, 
  ShoppingCart, 
  Search, 
  Car, 
  Store,
  Package,
  Star,
  MessageCircle
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useUnreadMessages();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    if (logout) logout();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        const toggleButton = document.getElementById('mobile-menu-button');
        const mobileAuthContainer = document.getElementById('mobile-auth-container');
        if (
          (toggleButton && toggleButton.contains(event.target)) ||
          (mobileAuthContainer && mobileAuthContainer.contains(event.target))
        ) {
          return;
        }
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const ProfileAvatar = ({ size = 24, className = "" }) => {
    if (user && user.profile_picture) {
      return (
        <img
          src={user.profile_picture}
          alt={user.name || user.username || "Profile"}
          className={`rounded-full object-cover ${
            size === 28 ? 'w-7 h-7' : 'w-6 h-6'
          } ${className}`}
          onError={(e) => { 
            console.error("ProfileAvatar image load error in Navbar. SRC:", e.target.src);
          }}
        />
      );
    }
    return <UserCircle size={size} className={className} />;
  };

  const getRoleBasedNavItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'SELLER':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: Store },
          { to: '/my-shop', label: 'My Shops', icon: Store },
          { to: '/add-parts', label: 'Add Part', icon: Package },
          { to: '/add-shop', label: 'Add Shop', icon: Store },
          { to: '/orders', label: 'Orders', icon: ShoppingCart },
        ];
      case 'BUYER':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: UserCircle },
          { to: '/orders', label: 'My Orders', icon: ShoppingCart },
          { to: '/my-hire-requests', label: 'My Hire Requests', icon: Package },
          { to: '/wishlist', label: 'Wishlist', icon: Star },
        ];
      case 'MECHANIC':
        return [
          { to: `/mechanic/${user.id.toString().slice(0, -1)}`, label: 'Public Profile', icon: Star },
          { to: '/dashboard', label: 'Dashboard', icon: UserCircle },
          { to: '/mechanic-requests', label: 'Service Requests', icon: Package },
          { to: '/orders', label: 'My Orders', icon: ShoppingCart },
          
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Admin Panel', icon: UserCircle },
          { to: '/admin/users', label: 'Users', icon: UserCircle },
          { to: '/admin/parts', label: 'Parts', icon: Package },
        ];
      default:
        return [];
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
      <div className="max-w-screen-xl flex items-center justify-between mx-auto px-4 py-3">
        {/* Logo and Brand */}
        <Link 
          to="/" 
          className="flex items-center space-x-2 text-black hover:text-orange-600 transition-colors duration-200"
          onClick={handleMobileLinkClick}
        >
          <Car size={32} className="text-orange-500" />
          <span className="text-2xl font-display font-bold">
            Drive<span className="text-orange-500 hover:text-black">Drip</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          <div className="flex items-center space-x-6">
            
            <Link to="/parts" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200">
              Spare Parts
            </Link>
            <Link to="/3d-cars" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200">
              3D Cars
            </Link>
            <Link to="/shops" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200">
              Shops
            </Link>
            <Link to="/mechanics" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200">
              Mechanics
            </Link>
            <Link to="/popular" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 flex items-center space-x-1">
              <Star size={16} />
              <span>Popular</span>
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200">
              About
            </Link>
          </div>
        </div>

        {/* Desktop User Menu */}
        <div className="hidden lg:flex items-center space-x-4">
          {user ? (
            <>
              {/* Desktop Dropdown Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 text-black hover:text-orange-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                  <ProfileAvatar size={28} className="ring-2 ring-transparent" />
                  <span className="font-medium">{user.name || user.username}</span>
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Content */}
                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3">
                      <ProfileAvatar size={40} className="ring-2 ring-orange-200" />
                      <div>
                        <p className="font-semibold text-black">{user.name || user.username}</p>
                        <p className="text-sm text-gray-600 capitalize bg-gray-100 px-2 py-1 rounded-full">{user.role.toLowerCase()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors rounded-2xl mx-2"
                    >
                      <UserCircle size={18} />
                      <span>My Profile</span>
                    </Link>
                    
                    {getRoleBasedNavItems().map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors rounded-2xl mx-2"
                      >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                    
                  </div>
                  
                  <div className="border-t border-gray-200/50 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left rounded-2xl mx-2"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Cart for buyers */}
              {user.role === 'BUYER' && (
                <>
                  {/* Chat Icon */}
                  <Link to="/chat" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors rounded-full hover:bg-gray-100">
                    <MessageCircle size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Cart Icon */}
                  <Link to="/cart" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors rounded-full hover:bg-gray-100">
                    <ShoppingCart size={20} />
                    {cart.totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                        {cart.totalItems}
                      </span>
                    )}
                  </Link>
                </>
              )}
              
              {/* Chat for sellers */}
              {user.role === 'SELLER' && (
                <Link to="/chat" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors rounded-full hover:bg-gray-100">
                  <MessageCircle size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              
              {/* Chat for mechanics */}
              {user.role === 'MECHANIC' && (
                <Link to="/chat" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors rounded-full hover:bg-gray-100">
                  <MessageCircle size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="px-5 py-2 border-2 border-orange-500 text-orange-600 rounded-full hover:bg-orange-50 transition-all duration-300 font-medium text-sm"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg"
              >
                Register
              </Link>
             
            </>
          )}
        </div>

        {/* Mobile Menu Controls */}
        <div className="lg:hidden flex items-center space-x-2">
         

          {/* Mobile Profile/Auth */}
          {user && (
            <Link
              to="/profile"
              className="p-1.5 text-gray-700 hover:text-orange-600 transition-colors"
              onClick={handleMobileLinkClick}
            >
              <ProfileAvatar size={24} />
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-button"
            onClick={toggleMobileMenu}
            className="p-2 text-gray-700 hover:text-orange-600 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        ref={menuRef}
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-sm shadow-xl border-t border-gray-200/50`}
      >
        <div className="px-4 py-6 space-y-4">
          {/* Main Navigation */}
          <div className="space-y-2">
            <Link 
              to="/home" 
              className="block py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors"
              onClick={handleMobileLinkClick}
            >
              Home
            </Link>
            <Link 
              to="/parts" 
              className="block py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors"
              onClick={handleMobileLinkClick}
            >
              Spare Parts
            </Link>
            <Link 
              to="/3d-cars" 
              className="block py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors"
              onClick={handleMobileLinkClick}
            >
              3D Cars
            </Link>
            <Link 
              to="/shops" 
              className="block py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors"
              onClick={handleMobileLinkClick}
            >
              Shops
            </Link>
            <Link 
              to="/mechanics" 
              className="block py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors"
              onClick={handleMobileLinkClick}
            >
              Mechanics
            </Link>
            <Link 
              to="/popular" 
              className="py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors flex items-center space-x-2"
              onClick={handleMobileLinkClick}
            >
              <Star size={16} className="text-orange-500" />
              <span>Popular</span>
            </Link>
            <Link 
              to="/about" 
              className="block py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors"
              onClick={handleMobileLinkClick}
            >
              About
            </Link>
          </div>

          {/* User-specific Navigation */}
          {user && (
            <>
              <div className="border-t border-gray-200/50 pt-4 space-y-2">
                {getRoleBasedNavItems().map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors flex items-center space-x-2"
                    onClick={handleMobileLinkClick}
                  >
                    <item.icon size={16} className="text-orange-500" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                
                {/* Chat option for all authenticated users */}
                {user && (
                  <Link
                    to="/chat"
                    className="py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors flex items-center space-x-2"
                    onClick={handleMobileLinkClick}
                  >
                    <div className="relative">
                      <MessageCircle size={16} className="text-orange-500" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>Messages {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
                  </Link>
                )}
                
                {user.role === 'BUYER' && (
                  <Link
                    to="/cart"
                    className="py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors flex items-center space-x-2"
                    onClick={handleMobileLinkClick}
                  >
                    <div className="relative">
                      <ShoppingCart size={16} className="text-orange-500" />
                      {cart.totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                          {cart.totalItems}
                        </span>
                      )}
                    </div>
                    <span>My Cart ({cart.totalItems || 0})</span>
                  </Link>
                )}
              </div>

              <div className="border-t border-gray-200/50 pt-4">
                <div className="flex items-center space-x-3 py-3 px-4 bg-gray-50 rounded-2xl mb-3">
                  <ProfileAvatar size={32} className="ring-2 ring-orange-200" />
                  <div>
                    <p className="text-black font-medium">{user.name || user.username}</p>
                    <p className="text-gray-600 text-sm capitalize bg-gray-100 px-2 py-1 rounded-full inline-block">{user.role.toLowerCase()}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}

          {/* Auth Links for Non-users */}
          {!user && (
            <div className="border-t border-gray-200/50 pt-4 space-y-3">
              <Link 
                to="/login" 
                className="block w-full py-3 px-4 text-center border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 font-medium transition-colors"
                onClick={handleMobileLinkClick}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="block w-full py-3 px-4 text-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full font-medium transition-colors"
                onClick={handleMobileLinkClick}
              >
                Register
              </Link>
              <Link 
                to="/register-mechanic" 
                className="block w-full py-3 px-4 text-center border-2 border-orange-500 text-orange-600 rounded-full hover:bg-orange-50 font-medium transition-colors"
                onClick={handleMobileLinkClick}
              >
                Register as Mechanic
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;