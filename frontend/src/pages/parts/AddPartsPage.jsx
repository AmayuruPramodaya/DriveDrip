import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Package, 
  Upload, 
  Car, 
  AlertCircle, 
  CheckCircle, 
  X,
  Plus,
  Minus,
  MapPin,
  Store,
  Sparkles
} from 'lucide-react';
import { sparePartsAPI, vehicleAPI, shopAPI } from '../../services/api';
import { sriLankanLocations, getProvinces, getDistrictsByProvince } from '../../data/locations';

const AddPartsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [categories, setCategories] = useState([]);
  const [vehicleBrands, setVehicleBrands] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  
  // Shop and location data
  const [userShops, setUserShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [hasShop, setHasShop] = useState(false);
  const [provinces] = useState(getProvinces());
  const [districts, setDistricts] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    part_number: '',
    category: '',
    condition: 'NEW',
    price: '',
    quantity: '1',
    shop: '', // Selected shop ID
    main_image: null,
    additional_images: [],
    compatible_vehicles: [],
    // Location data (only used if user has no shop)
    location_type: 'shop', // 'shop' or 'manual'
    province: '',
    district: '',
    address: ''
  });

  // Vehicle selection state
  const [vehicleSelection, setVehicleSelection] = useState({
    brand: '',
    model: '',
    year_from: new Date().getFullYear() - 20,
    year_to: new Date().getFullYear()
  });

  useEffect(() => {
    // Check if user is a seller
    if (user && user.role !== 'SELLER') {
      navigate('/dashboard');
      return;
    }

    fetchInitialData();
  }, [user, navigate]);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, brandsRes, modelsRes] = await Promise.all([
        sparePartsAPI.getCategories(),
        vehicleAPI.getBrands(),
        vehicleAPI.getModels()
      ]);
      
      setCategories(categoriesRes.data.results || categoriesRes.data || []);
      setVehicleBrands(brandsRes.data.results || brandsRes.data || []);
      setVehicleModels(modelsRes.data.results || modelsRes.data || []);
      
      // Try to fetch user's shops
      try {
        const shopRes = await shopAPI.getUserShops();
        const shops = shopRes.data.results || shopRes.data || [];
        setUserShops(shops);
        
        if (shops.length > 0) {
          setHasShop(true);
          setSelectedShop(shops[0]); // Select first shop by default
          setFormData(prev => ({
            ...prev,
            shop: shops[0].id,
            location_type: 'shop'
          }));
        } else {
          setHasShop(false);
          setFormData(prev => ({
            ...prev,
            location_type: 'manual'
          }));
        }
      } catch (shopError) {
        // User has no shops
        setHasShop(false);
        setFormData(prev => ({
          ...prev,
          location_type: 'manual'
        }));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setMessage({ type: 'error', text: 'Failed to load form data. Please refresh the page.' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update districts when province changes
    if (name === 'province') {
      const newDistricts = getDistrictsByProvince(value);
      setDistricts(newDistricts);
      setFormData(prev => ({
        ...prev,
        district: '' // Reset district when province changes
      }));
    }
  };

  const handleVehicleSelectionChange = (e) => {
    const { name, value } = e.target;
    setVehicleSelection(prev => ({
      ...prev,
      [name]: value
    }));

    // Filter models when brand changes
    if (name === 'brand') {
      const filtered = vehicleModels.filter(model => model.brand == value);
      setFilteredModels(filtered);
      setVehicleSelection(prev => ({ ...prev, model: '' }));
    }
  };

  const addCompatibleVehicle = () => {
    const { brand, model, year_from, year_to } = vehicleSelection;
    
    if (!brand || !model) {
      setMessage({ type: 'error', text: 'Please select both brand and model' });
      return;
    }

    const selectedBrand = vehicleBrands.find(b => b.id == brand);
    const selectedModel = vehicleModels.find(m => m.id == model);
    
    const newVehicle = {
      id: Date.now(), // Temporary ID for frontend
      brand_id: brand,
      model_id: model,
      brand_name: selectedBrand?.name,
      model_name: selectedModel?.name,
      year_from: parseInt(year_from),
      year_to: parseInt(year_to)
    };

    // Check for duplicates
    const isDuplicate = selectedVehicles.some(v => 
      v.brand_id == brand && v.model_id == model
    );

    if (isDuplicate) {
      setMessage({ type: 'error', text: 'This vehicle is already added' });
      return;
    }

    setSelectedVehicles(prev => [...prev, newVehicle]);
    setVehicleSelection({
      brand: '',
      model: '',
      year_from: new Date().getFullYear() - 20,
      year_to: new Date().getFullYear()
    });
    setFilteredModels([]);
    setMessage({ type: '', text: '' });
  };

  const removeCompatibleVehicle = (vehicleId) => {
    setSelectedVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Please enter a Part Name first.' });
      return;
    }
    setGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      const data = {
        name: formData.name,
        part_number: formData.part_number,
        condition: formData.condition,
      };
      const response = await sparePartsAPI.generateDescription(data);
      setFormData(prev => ({
        ...prev,
        description: response.data.description
      }));
      setMessage({ type: 'success', text: 'AI description generated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('AI generation error:', error);
      setMessage({ type: 'error', text: 'AI generation failed. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const { name } = e.target;
    
    // Function to truncate filename if it's too long
    const truncateFilename = (file) => {
      if (file.name.length <= 100) return file;
      
      const extension = file.name.split('.').pop();
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
      const maxNameLength = 100 - extension.length - 1; // -1 for the dot
      const truncatedName = nameWithoutExt.substring(0, maxNameLength);
      
      // Create a new file with truncated name
      const truncatedFile = new File([file], `${truncatedName}.${extension}`, {
        type: file.type,
        lastModified: file.lastModified
      });
      
      return truncatedFile;
    };
    
    if (name === 'main_image') {
      const truncatedFile = truncateFilename(files[0]);
      setFormData(prev => ({ ...prev, main_image: truncatedFile }));
      
      // Create preview
      if (files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImages(prev => ({ ...prev, main: e.target.result }));
        };
        reader.readAsDataURL(files[0]);
      }
    } else if (name === 'additional_images') {
      const truncatedFiles = files.map(file => truncateFilename(file));
      setFormData(prev => ({ ...prev, additional_images: truncatedFiles }));
      
      // Create previews
      const previews = [];
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews[index] = e.target.result;
          if (previews.length === files.length) {
            setPreviewImages(prev => ({ ...prev, additional: previews }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validation
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        setMessage({ type: 'error', text: 'Please fill in all required fields' });
        setLoading(false);
        return;
      }

      // Shop validation for users with shops
      if (hasShop && userShops.length > 0) {
        if (!formData.shop) {
          setMessage({ type: 'error', text: 'Please select a shop for this part' });
          setLoading(false);
          return;
        }
      }

      // Location validation for users without shops
      if (!hasShop) {
        if (!formData.province || !formData.district || !formData.address) {
          setMessage({ type: 'error', text: 'Please provide complete location information (province, district, and address)' });
          setLoading(false);
          return;
        }
      }

      // Prepare form data for submission
      const submitData = new FormData();
      
      // Basic fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('part_number', formData.part_number);
      submitData.append('category', formData.category); // This should be category ID
      submitData.append('condition', formData.condition);
      submitData.append('price', formData.price);
      submitData.append('quantity', formData.quantity);
      
      // Shop field (if user has shops)
      if (hasShop && formData.shop) {
        submitData.append('shop', formData.shop);
      }
      
      // Location information
      if (hasShop) {          // If user has a shop, use shop location but allow override with manual location
          if (formData.province && formData.district) {
            submitData.append('province', formData.province);
            submitData.append('district', formData.district);
          }
          if (formData.address) {
            submitData.append('location_address', formData.address);
          }
      } else {
        // If user has no shop, location is required
        submitData.append('province', formData.province);
        submitData.append('district', formData.district);
        submitData.append('location_address', formData.address);
      }
      
      // Compatible vehicles - send as array of vehicle model IDs
      const vehicleIds = selectedVehicles.map(v => v.model_id);
      vehicleIds.forEach(id => {
        submitData.append('compatible_vehicles', id);
      });
      
      // Images
      if (formData.main_image) {
        submitData.append('main_image', formData.main_image);
      }
      
      // TODO: Handle additional images after spare part creation
      // Additional images need to be handled separately via SparePartImage model
      
      console.log('Submitting form data:');
      console.log('- name:', formData.name);
      console.log('- description:', formData.description);
      console.log('- part_number:', formData.part_number);
      console.log('- category:', formData.category);
      console.log('- condition:', formData.condition);
      console.log('- price:', formData.price);
      console.log('- quantity:', formData.quantity);
      console.log('- compatible_vehicles:', vehicleIds);
      console.log('- has_main_image:', !!formData.main_image);
      console.log('- user:', user);
      console.log('- user.role:', user?.role);
      
      // Log FormData contents for debugging
      for (let [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(`FormData ${key}:`, value.name, value.size, 'bytes');
        } else {
          console.log(`FormData ${key}:`, value);
        }
      }

      const response = await sparePartsAPI.createSparePart(submitData);
      
      setMessage({ type: 'success', text: 'Spare part added successfully!' });
      
      // Reset form after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding spare part:', error);
      console.error('Error response:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 
              error.response?.data?.message || 
              Object.values(error.response?.data || {}).flat().join(', ') || 
              'Failed to add spare part. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'SELLER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">Access Denied</h2>
          <p className="text-gray-600">Only sellers can add spare parts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-white/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <Package size={24} className="text-white" />
              <h1 className="text-2xl font-bold text-white">Add New Spare Part</h1>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`px-6 py-4 border-l-4 ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-400 text-green-800' 
                : 'bg-red-50 border-red-400 text-red-800'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckCircle size={20} className="mr-2" />
                ) : (
                  <AlertCircle size={20} className="mr-2" />
                )}
                {message.text}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Shop Selection - Show only if user has shops */}
            {hasShop && userShops.length > 0 && (
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                  <Store className="w-5 h-5 mr-2 text-orange-500" />
                  Select Shop for this Part
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {userShops.length === 1 ? (
                    <div className="p-4 border border-gray-200 rounded-2xl bg-orange-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex-shrink-0">
                          {userShops[0].logo ? (
                            <img 
                              src={userShops[0].logo.startsWith('http') ? userShops[0].logo : `http://localhost:8000${userShops[0].logo}`} 
                              alt={userShops[0].name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-black">{userShops[0].name}</p>
                          <p className="text-sm text-gray-600">
                            {userShops[0].district}, {userShops[0].province}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-black mb-3">
                        Choose Shop *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {userShops.map((shop) => (
                          <div
                            key={shop.id}
                            className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                              formData.shop === shop.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, shop: shop.id }));
                              setSelectedShop(shop);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                                {shop.logo ? (
                                  <img 
                                    src={shop.logo.startsWith('http') ? shop.logo : `http://localhost:8000${shop.logo}`} 
                                    alt={shop.name} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Store className="w-5 h-5 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-black text-sm">{shop.name}</p>
                                <p className="text-xs text-gray-600">
                                  {shop.district}, {shop.province}
                                </p>
                              </div>
                              <input
                                type="radio"
                                name="shop"
                                value={shop.id}
                                checked={formData.shop === shop.id}
                                onChange={() => {}}
                                className="text-orange-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Part Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  placeholder="e.g., Brake Pads Front Set"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Part Number
                </label>
                <input
                  type="text"
                  name="part_number"
                  value={formData.part_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  placeholder="e.g., BP123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Condition *
                </label>
                <select
                  name="condition"
                  required
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                >
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                  <option value="REFURBISHED">Refurbished</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Price (Rs) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Description *
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-32 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  placeholder="Detailed description of the spare part..."
                />
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={generating}
                  className="absolute bottom-3 right-3 flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium text-xs disabled:opacity-70"
                >
                  {generating ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>{generating ? 'Generating...' : 'Generate with AI'}</span>
                </button>
              </div>
            </div>

            {/* Shop and Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <MapPin size={20} className="mr-2 text-orange-500" />
                Location Information
              </h3>
              
              {hasShop ? (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Store size={20} className="text-blue-600" />
                    <h4 className="font-medium text-blue-800">Your Shop: {selectedShop?.name}</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Parts will be available at your shop location: {selectedShop?.address}
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Province
                        </label>
                        <select
                          name="province"
                          value={formData.province}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                        >
                          <option value="">Select Province</option>
                          {provinces.map(province => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          District
                        </label>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          disabled={!formData.province}
                        >
                          <option value="">Select District</option>
                          {districts.map(district => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Street Address / Additional Details
                      </label>
                      <textarea
                        name="address"
                        rows={2}
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                        placeholder="Street address, building number, additional directions..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle size={20} className="text-amber-600" />
                    <h4 className="font-medium text-amber-800">No Shop Found</h4>
                  </div>
                  <p className="text-sm text-amber-700 mb-4">
                    Since you don't have a shop, please provide the location where this part is available.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Province *
                        </label>
                        <select
                          name="province"
                          required
                          value={formData.province}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                        >
                          <option value="">Select Province</option>
                          {provinces.map(province => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          District *
                        </label>
                        <select
                          name="district"
                          required
                          value={formData.district}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          disabled={!formData.province}
                        >
                          <option value="">Select District</option>
                          {districts.map(district => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Address *
                      </label>
                      <textarea
                        name="address"
                        required
                        rows={3}
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                        placeholder="Complete address where the part is available..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compatible Vehicles */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Car size={20} className="mr-2 text-orange-500" />
                Compatible Vehicles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Brand
                  </label>
                  <select
                    name="brand"
                    value={vehicleSelection.brand}
                    onChange={handleVehicleSelectionChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">Select Brand</option>
                    {vehicleBrands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Model
                  </label>
                  <select
                    name="model"
                    value={vehicleSelection.model}
                    onChange={handleVehicleSelectionChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!vehicleSelection.brand}
                  >
                    <option value="">Select Model</option>
                    {filteredModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Year From
                  </label>
                  <input
                    type="number"
                    name="year_from"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={vehicleSelection.year_from}
                    onChange={handleVehicleSelectionChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 text-center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Year To
                  </label>
                  <input
                    type="number"
                    name="year_to"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    value={vehicleSelection.year_to}
                    onChange={handleVehicleSelectionChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 text-center"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addCompatibleVehicle}
                className="px-6 py-3 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 flex items-center space-x-2 mb-4"
              >
                <Plus size={16} />
                <span>Add Vehicle</span>
              </button>

              {/* Selected Vehicles */}
              {selectedVehicles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-black">Selected Vehicles:</h4>
                  {selectedVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                      <span className="text-sm">
                        {vehicle.brand_name} {vehicle.model_name} ({vehicle.year_from} - {vehicle.year_to})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCompatibleVehicle(vehicle.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-all duration-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Upload size={20} className="mr-2 text-orange-500" />
                Images
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Main Image
                  </label>
                  <input
                    type="file"
                    name="main_image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  />
                  {previewImages.main && (
                    <img 
                      src={previewImages.main} 
                      alt="Main preview" 
                      className="mt-2 w-32 h-32 object-cover rounded-2xl shadow-md"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Additional Images (Optional)
                  </label>
                  <input
                    type="file"
                    name="additional_images"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  />
                  {previewImages.additional && previewImages.additional.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {previewImages.additional.map((preview, index) => (
                        <img 
                          key={index}
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-20 h-20 object-cover rounded-2xl shadow-md"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Package size={16} />
                    <span>Add Spare Part</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPartsPage;
// Fixed userShop reference to selectedShop
