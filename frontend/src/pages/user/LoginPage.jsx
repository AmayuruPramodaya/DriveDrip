
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AtSign, Lock, AlertCircle, Eye, EyeOff, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

const InputField = ({ id, name, label, type = "text", value, onChange, placeholder, icon, required = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-black mb-2">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
          {React.cloneElement(icon, { className: "h-5 w-5 text-gray-400" })}
        </div>
      )}
      <input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 ${icon ? 'pl-12' : 'pl-4'}`}
      />
    </div>
  </div>
);

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, setError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    await login(username, password);
  };

  return (
    <div className='w-full min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 relative overflow-hidden'>
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
      
      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center py-12 px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 max-w-6xl w-full">
          
          {/* Logo and Branding Section */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:flex-1">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-black flex items-center justify-center shadow-lg">
                <Car size={40} className="text-white lg:w-12 lg:h-12" />
              </div>
              <span className="text-4xl lg:text-5xl font-display font-bold text-black">
                Drive<span className="text-orange-500">Drip</span>
              </span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-black">
                Your Premium Auto Parts Experience
              </h1>
              <p className="text-gray-600 text-lg lg:text-xl max-w-md">
                Discover quality vehicle spare parts, connect with verified sellers, and keep your vehicle running smoothly.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 mt-6">
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-sm">🔧</span>
                </div>
                <span className="text-black font-medium">Quality Parts</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-black font-medium">Verified Sellers</span>
              </div>
            </div>
          </div>

          {/* Login Form Section */}
          <div className="w-full max-w-md lg:flex-shrink-0">
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-3xl font-display font-bold text-black">
                Welcome Back
              </h2>
              <p className="mt-2 text-gray-600">
                Sign in to your account to continue
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 py-8 px-6">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800 font-medium">
                          {typeof error === 'string'
                            ? error
                            : error.detail || "Login failed. Please check your credentials."}
                        </p>
                        {/* More detailed error display if error is an object with field errors */}
                        {typeof error === 'object' && error !== null && !error.detail && Object.keys(error).length > 0 && (
                          <div className="mt-2 text-sm text-red-700">
                            <ul role="list" className="list-disc pl-5 space-y-1">
                              {Object.entries(error).map(([key, value]) => (
                                <li key={key}>
                                  <strong>{key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}:</strong> {Array.isArray(value) ? value.join(', ') : value}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <InputField
                  id="username"
                  name="username"
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  icon={<AtSign />}
                  required
                />

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 pl-12 pr-12"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-orange-500 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-orange-500 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-orange-600 hover:text-orange-500 transition-colors">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg"
                  >
                    Sign In
                  </button>
                </div>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-600">New to DriveDrip?</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      to="/register"
                      className="w-full flex justify-center py-3 px-4 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 font-medium"
                    >
                      Create an Account
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;