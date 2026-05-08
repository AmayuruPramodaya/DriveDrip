
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, AtSign, Lock, CalendarDays, BadgeInfo, Phone, AlertCircle, Eye, EyeOff, Car, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const InputField = ({ id, name, label, type = "text", value, onChange, placeholder, icon, required = false, pattern, title }) => (
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
        pattern={pattern}
        title={title}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 ${icon ? 'pl-12' : 'pl-4'}`}
      />
    </div>
  </div>
);

const SelectField = ({ id, name, label, value, onChange, options, icon, required = false }) => (
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
      <select
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 ${icon ? 'pl-12' : 'pl-4'} pr-10`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    dob: '',
    nic: '',
    mobile_no: '',
    role: 'BUYER', // Default role
  });
  const { register, error, setError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const roleOptions = [
    { value: 'BUYER', label: 'Buyer (Purchase parts)' },
    { value: 'SELLER', label: 'Seller (Manage shop & sell parts)' },
    { value: 'MECHANIC', label: 'Mechanic (Provide vehicle services)' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      setError({ detail: "Name, Email, Username, and Password are required." });
      return;
    }
    if (formData.password.length < 8) {
      setError({ detail: "Password must be at least 8 characters long." });
      return;
    }
    
    // Mechanic-specific validation
    if (formData.role === 'MECHANIC') {
      if (!formData.experience_years || !formData.district || !formData.province || !formData.description) {
        setError({ detail: "For mechanics, Experience Years, District, Province, and Description are required." });
        return;
      }
      if (parseInt(formData.experience_years) < 0) {
        setError({ detail: "Experience years must be a positive number." });
        return;
      }
      if (formData.hourly_rate && parseFloat(formData.hourly_rate) < 0) {
        setError({ detail: "Hourly rate must be a positive number." });
        return;
      }
    }
    
    // NIC validation (optional)
    if (formData.nic && !/^\d{10}$/.test(formData.nic) && !/^[0-9]{9}[vVxX]$/.test(formData.nic) && !/^\d{12}$/.test(formData.nic)) {
      setError({ nic: ["NIC must be 10 digits, 12 digits, or 9 digits followed by V/X."] });
      return;
    }
    // Mobile number validation (optional)
    if (formData.mobile_no && !/^\d{10}$/.test(formData.mobile_no)) {
      setError({ mobile_no: ["Mobile number must be 10 digits."] });
      return;
    }

    await register(formData);
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
          <div className="absolute top-20 right-10 w-6 h-6 bg-orange-400/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-32 left-2/3 w-4 h-4 bg-orange-500/30 rounded-square rotate-45 animate-bounce"></div>
          <div className="absolute top-1/3 right-3/4 w-8 h-8 border-2 border-orange-300/40 rounded-full animate-pulse"></div>
          
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
        <div className="flex flex-col lg:flex-row-reverse items-start justify-center gap-12 lg:gap-16 max-w-7xl w-full">
          
          {/* Logo and Branding Section - Now on the right */}
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
                Join Our Auto Community
              </h1>
              <p className="text-gray-600 text-lg lg:text-xl max-w-md">
                Create your account to start buying, selling quality vehicle spare parts, or providing professional mechanic services.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-4 mt-6">
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-sm">🛒</span>
                </div>
                <span className="text-black font-medium">Buy Quality Parts</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">🏪</span>
                </div>
                <span className="text-black font-medium">Sell Your Parts</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🔧</span>
                </div>
                <span className="text-black font-medium">Provide Mechanic Services</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 text-sm">✓</span>
                </div>
                <span className="text-black font-medium">Verified Community</span>
              </div>
            </div>
          </div>

          {/* Registration Form Section - Now on the left */}
          <div className="w-full max-w-2xl lg:flex-shrink-0">
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-3xl font-display font-bold text-black">
                Create Your Account
              </h2>
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
                            : error.detail || "There were errors with your submission"}
                        </p>
                        {typeof error === 'object' && error !== null && !error.detail && (
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

                {/* Account Type and Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SelectField
                    id="role"
                    name="role"
                    label="Account Type"
                    value={formData.role}
                    onChange={handleChange}
                    options={roleOptions}
                    icon={<Users />}
                    required
                  />

                  <InputField
                    id="name"
                    name="name"
                    label="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    icon={<User />}
                    placeholder="John Doe"
                  />
                </div>

                {/* Email and Username Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    icon={<Mail />}
                    placeholder="you@example.com"
                  />

                  <InputField
                    id="username"
                    name="username"
                    label="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    icon={<AtSign />}
                    placeholder="yourusername"
                  />
                </div>

                {/* Password */}
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
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter a strong password"
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
                  <p className="mt-1 text-xs text-gray-600">
                    Password must be at least 8 characters long
                  </p>
                </div>

                {/* Personal Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    id="dob"
                    name="dob"
                    type="date"
                    label="Date of Birth"
                    value={formData.dob}
                    onChange={handleChange}
                    icon={<CalendarDays />}
                  />

                  <InputField
                    id="mobile_no"
                    name="mobile_no"
                    type="tel"
                    label="Mobile Number (Optional)"
                    value={formData.mobile_no}
                    onChange={handleChange}
                    icon={<Phone />}
                    placeholder="07XXXXXXXX"
                    pattern="\d{10}"
                    title="Mobile number must be 10 digits"
                  />
                </div>

                {/* NIC Number */}
                <InputField
                  id="nic"
                  name="nic"
                  label="NIC Number (Optional)"
                  value={formData.nic}
                  onChange={handleChange}
                  icon={<BadgeInfo />}
                  placeholder="123456789V or 199012345678"
                  title="NIC must be 10 digits, 12 digits, or 9 digits followed by V/X."
                />

                {/* Mechanic-specific fields */}
                {formData.role === 'MECHANIC' && (
                  <div className="space-y-6 p-6 bg-orange-50 rounded-2xl border border-orange-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Car className="mr-2 h-5 w-5 text-orange-600" />
                      Mechanic Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        id="business_name"
                        name="business_name"
                        label="Business Name (Optional)"
                        value={formData.business_name || ''}
                        onChange={handleChange}
                        icon={<BadgeInfo />}
                        placeholder="Your Garage Name"
                      />
                      
                      <InputField
                        id="experience_years"
                        name="experience_years"
                        type="number"
                        label="Years of Experience"
                        value={formData.experience_years || ''}
                        onChange={handleChange}
                        icon={<CalendarDays />}
                        placeholder="e.g., 5"
                        required
                        min="0"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        id="license_number"
                        name="license_number"
                        label="License Number (Optional)"
                        value={formData.license_number || ''}
                        onChange={handleChange}
                        icon={<BadgeInfo />}
                        placeholder="Your professional license number"
                      />
                      
                      <InputField
                        id="hourly_rate"
                        name="hourly_rate"
                        type="number"
                        label="Hourly Rate (LKR) (Optional)"
                        value={formData.hourly_rate || ''}
                        onChange={handleChange}
                        icon={<BadgeInfo />}
                        placeholder="e.g., 2500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        id="district"
                        name="district"
                        label="District"
                        value={formData.district || ''}
                        onChange={handleChange}
                        icon={<BadgeInfo />}
                        placeholder="e.g., Colombo"
                        required
                      />
                      
                      <InputField
                        id="province"
                        name="province"
                        label="Province"
                        value={formData.province || ''}
                        onChange={handleChange}
                        icon={<BadgeInfo />}
                        placeholder="e.g., Western"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="business_address" className="block text-sm font-medium text-black mb-2">
                        Business Address (Optional)
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute top-3 left-4 flex items-start">
                          <BadgeInfo className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          name="business_address"
                          id="business_address"
                          rows={3}
                          value={formData.business_address || ''}
                          onChange={handleChange}
                          placeholder="Your garage/shop address..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 pl-12 resize-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="service_area" className="block text-sm font-medium text-black mb-2">
                        Service Area (Optional)
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute top-3 left-4 flex items-start">
                          <BadgeInfo className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          name="service_area"
                          id="service_area"
                          rows={2}
                          value={formData.service_area || ''}
                          onChange={handleChange}
                          placeholder="Describe the areas you provide service to..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 pl-12 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="is_mobile"
                        name="is_mobile"
                        checked={formData.is_mobile || false}
                        onChange={(e) => setFormData({...formData, is_mobile: e.target.checked})}
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <label htmlFor="is_mobile" className="text-sm font-medium text-gray-900">
                        Mobile Mechanic (I can travel to customer locations)
                      </label>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
                        Professional Description
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute top-3 left-4 flex items-start">
                          <BadgeInfo className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          name="description"
                          id="description"
                          rows={4}
                          value={formData.description || ''}
                          onChange={handleChange}
                          required
                          placeholder="Describe your experience, specializations, and services you provide..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 pl-12 resize-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="certifications" className="block text-sm font-medium text-black mb-2">
                        Certifications & Qualifications (Optional)
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute top-3 left-4 flex items-start">
                          <BadgeInfo className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          name="certifications"
                          id="certifications"
                          rows={3}
                          value={formData.certifications || ''}
                          onChange={handleChange}
                          placeholder="List your certifications, training, or relevant qualifications..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 pl-12 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg"
                  >
                    Create Account
                  </button>
                </div>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-600">Already have an account?</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      to="/login"
                      className="w-full flex justify-center py-3 px-4 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 font-medium"
                    >
                      Sign In
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

export default RegisterPage;