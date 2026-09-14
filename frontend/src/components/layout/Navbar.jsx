import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  MessageCircle,
  Headphones,
  Phone,
  Heart,
  User
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useUnreadMessages();
  const location = useLocation();

  const getDesktopClass = (path, extraClass = '') => {
    const isRoot = path === '/home' && location.pathname === '/';
    const isActive = location.pathname.startsWith(path) || isRoot;
    const base = isActive 
      ? 'text-orange-600 border-b-2 border-orange-600 pb-1' 
      : 'text-gray-700 hover:text-orange-600 transition-colors duration-200';
    return `${base} ${extraClass}`.trim();
  };

  const getMobileClass = (path) => {
    const isRoot = path === '/home' && location.pathname === '/';
    const isActive = location.pathname.startsWith(path) || isRoot;
    return isActive
      ? 'block py-3 px-4 text-orange-600 bg-orange-50 rounded-2xl font-semibold'
      : 'block py-3 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors';
  };

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
          className={`rounded-full object-cover ${size === 28 ? 'w-7 h-7' : 'w-6 h-6'
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
    <header className="fixed top-0 left-0 w-full z-50 shadow-sm font-sans">
      {/* Top Banner */}
      <div className="bg-[#1a2332] text-white/90 py-1.5 px-4 hidden lg:block text-xs font-medium">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Headphones size={14} className="text-orange-500" />
            <span>Expert Support - Professional assistance available 24/7 across Sri Lanka</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Phone size={14} className="text-orange-500" />
              <span>+94 71 234 5678</span>
            </div>
            <span className="text-gray-500">|</span>
            <Link to="/register-mechanic" className="hover:text-orange-500 transition-colors">
              Register as Mechanic
            </Link>
          </div>
        </div>
      </div>

      <nav className="bg-white border-b border-gray-100">
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
            <div className="flex items-center space-x-6 text-sm font-semibold">
              <Link to="/home" className={getDesktopClass('/home')}>
                Home
              </Link>
              <Link to="/parts" className={getDesktopClass('/parts')}>
                Spare Parts
              </Link>
              <Link to="/3d-cars" className={getDesktopClass('/3d-cars', 'flex items-center space-x-1')}>
                <span>3D Cars</span>
                {/* <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded font-bold">NEW</span> */}
              </Link>
              <Link to="/shops" className={getDesktopClass('/shops')}>
                Shops
              </Link>
              <Link to="/mechanics" className={getDesktopClass('/mechanics')}>
                Mechanics
              </Link>
              <Link to="/popular" className={getDesktopClass('/popular', 'flex items-center space-x-1')}>
                <Star size={14} className="text-orange-500" />
                <span>Popular</span>
              </Link>
              <Link to="/about" className={getDesktopClass('/about')}>
                About
              </Link>
            </div>
          </div>

          {/* Desktop User Menu & CTA */}
          <div className="hidden lg:flex items-center space-x-5">
            <div className="flex items-center space-x-4 border-r border-gray-200 pr-5">
              <Link to="/dashboard" className="text-gray-600 hover:text-orange-600 transition-colors relative">
                <Package size={20} />
              </Link>
              <Link to="/wishlist" className="text-gray-600 hover:text-orange-600 transition-colors relative">
                <Heart size={20} />
              </Link>
              <Link to="/cart" className="text-gray-600 hover:text-orange-600 transition-colors relative flex items-center justify-center">
                <ShoppingCart size={20} />
                {cart && cart.totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
                    {cart.totalItems}
                  </span>
                )}
                {(!cart || cart.totalItems === 0) && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
                    1
                  </span>
                )}
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors text-sm font-medium">
                    <ProfileAvatar size={24} className="ring-2 ring-transparent" />
                    <span>{user.name || user.username}</span>
                  </button>
                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    <div className="py-2">
                      <Link to="/profile" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600">
                        <UserCircle size={16} />
                        <span>My Profile</span>
                      </Link>
                      {getRoleBasedNavItems().map((item) => (
                        <Link key={item.to} to={item.to} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600">
                          <item.icon size={16} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="flex items-center space-x-1.5 text-gray-700 hover:text-orange-600 transition-colors text-sm font-semibold">
                  <User size={18} />
                  <span>Sign In</span>
                </Link>
              )}

              <Link
                to="/add-parts"
                className="px-5 py-2.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-all font-semibold text-sm shadow-sm"
              >
                Post an Ad
              </Link>
            </div>
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
          className={`${isMobileMenuOpen ? 'block' : 'hidden'
            } lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-sm shadow-xl border-t border-gray-200/50`}
        >
          <div className="px-4 py-6 space-y-4">
            {/* Main Navigation */}
            <div className="space-y-2">
              <Link
                to="/home"
                className={getMobileClass('/home')}
                onClick={handleMobileLinkClick}
              >
                Home
              </Link>
              <Link
                to="/parts"
                className={getMobileClass('/parts')}
                onClick={handleMobileLinkClick}
              >
                Spare Parts
              </Link>
              <Link
                to="/3d-cars"
                className={getMobileClass('/3d-cars')}
                onClick={handleMobileLinkClick}
              >
                3D Cars
              </Link>
              <Link
                to="/shops"
                className={getMobileClass('/shops')}
                onClick={handleMobileLinkClick}
              >
                Shops
              </Link>
              <Link
                to="/mechanics"
                className={getMobileClass('/mechanics')}
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
    </header>
  );
};

export default Navbar;