// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/layout/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Footer from './components/layout/Footer.jsx';
import './App.css';

// Lazy load components
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const LoginPage = lazy(() => import('./pages/user/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/user/RegisterPage.jsx'));
const DashboardPage = lazy(() => import('./pages/user/DashboardPage.jsx'));
const PartsPage = lazy(() => import('./pages/parts/PartsPage.jsx'));
const ShopsPage = lazy(() => import('./pages/shops/ShopsPage.jsx'));
const AddPartsPage = lazy(() => import('./pages/parts/AddPartsPage.jsx'));
const OrderPage = lazy(() => import('./pages/order/OrderPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const WishlistPage = lazy(() => import('./pages/WishlistPage.jsx'));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage.jsx'));
const ShopDetailPage = lazy(() => import('./pages/shops/ShopDetailPage.jsx'));
const PartDetailPage = lazy(() => import('./pages/parts/PartDetailPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const AddShopPage = lazy(() => import('./pages/shops/AddShopPage.jsx'));
const MyShopPage = lazy(() => import('./pages/shops/MyShopPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const OrdersPage = lazy(() => import('./pages/order/OrdersPage.jsx'));
const OrderDetailsPage = lazy(() => import('./pages/order/OrderDetailsPage.jsx'));
const AdminSellerAnalysis = lazy(() => import('./pages/admin/AdminSellerAnalysis.jsx'));
const ProfileKevin = lazy(() => import('./pages/user/ProfileKevin.jsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.jsx'));
const CarCustomizer3D = lazy(() => import('./pages/CarCustomizer3D.jsx'));

// Mechanic Components
const MechanicRegistrationPage = lazy(() => import('./pages/mechanic/MechanicRegistrationPage.jsx'));
const MechanicsListPage = lazy(() => import('./pages/mechanic/MechanicsListPage.jsx'));
const MechanicProfilePage = lazy(() => import('./pages/mechanic/MechanicProfilePage.jsx'));
const HireMechanicPage = lazy(() => import('./pages/mechanic/HireMechanicPage.jsx'));
const MyHireRequestsPage = lazy(() => import('./pages/mechanic/MyHireRequestsPage.jsx'));
const RateMechanicPage = lazy(() => import('./pages/mechanic/RateMechanicPage.jsx'));
const MechanicRequestsPage = lazy(() => import('./pages/mechanic/MechanicRequestsPage.jsx'));

// Loading component
const LoadingSpinner = React.memo(() => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-pulse">Loading...</div>
  </div>
));

// Optimized GuestRoute
const GuestRoute = React.memo(({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return !user ? children : <Navigate to="/dashboard" replace />;
});

// Optimized AppContent
const AppContent = React.memo(() => (
  <div className="flex flex-col min-h-screen">
    <main className="pt-16 md:pt-19 flex-grow">
      <Navbar />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/parts/:partId" element={<PartDetailPage />} />
            <Route path="/spare-parts" element={<PartsPage />} />
            <Route path="/3d-cars" element={<CarCustomizer3D />} />
            <Route path="/shops" element={<ShopsPage />} />
            <Route path="/shops/:shopId" element={<ShopDetailPage />} />
            <Route path="/popular" element={<PartsPage />} />
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            
            {/* Mechanic Routes - Public */}
            <Route path="/mechanics" element={<MechanicsListPage />} />
            <Route path="/mechanic/:id" element={<MechanicProfilePage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/seller/dashboard" element={<DashboardPage />} />
              <Route path="/buyer/dashboard" element={<DashboardPage />} />
              <Route path="/admin/dashboard" element={<AdminSellerAnalysis />} />
              <Route path="/admin/seller-analysis" element={<AdminSellerAnalysis />} />
              <Route path="/add-parts" element={<AddPartsPage />} />
              <Route path="/seller/orders" element={<OrderPage />} />
              <Route path="/buyer/orders" element={<OrderPage />} />
              <Route path="/orders" element={<OrdersPage />} />                
              <Route 
                  path="/orders/:id" 
                  element={
                    
                      <OrderDetailsPage />
                   
                  } 
                />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Shop Management Routes */}
              <Route path="/add-shop" element={<AddShopPage />} />
              <Route path="/my-shop" element={<MyShopPage />} />
              
              {/* Mechanic Routes - Protected */}
              <Route path="/hire-mechanic/:id" element={<HireMechanicPage />} />
              <Route path="/my-hire-requests" element={<MyHireRequestsPage />} />
              <Route path="/rate-mechanic/:requestId" element={<RateMechanicPage />} />
              <Route path="/mechanic-requests" element={<MechanicRequestsPage />} />
              
              <Route path="/profile-kevin" element={<ProfileKevin />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Footer />
    </main>
  </div>
));

// Optimized App
const App = React.memo(() => (
  <Router>
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  </Router>
));

export default App;