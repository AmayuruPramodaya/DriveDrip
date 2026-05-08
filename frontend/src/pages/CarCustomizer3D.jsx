import React, { useState, useEffect } from 'react';
import { carModel3DAPI } from '../services/api';
import { sampleCarModels, fallbackCarModel } from '../data/sampleCarModels';
import ThreeDCarViewer from '../components/ThreeDCarViewerDebug';
import { 
  Car, 
  Palette, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Download,
  Share,
  AlertTriangle,
  Loader
} from 'lucide-react';

const CarCustomizer3D = () => {
  const [carModels, setCarModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [availableColors, setAvailableColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default color palette
  const defaultColors = {
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'White': '#FFFFFF',
    'Black': '#000000',
    'Silver': '#C0C0C0',
    'Green': '#00FF00',
    'Yellow': '#FFFF00',
    'Orange': '#FFA500',
    'Purple': '#800080',
    'Pink': '#FFC0CB'
  };

  useEffect(() => {
    fetchCarModels();
  }, []);

  const fetchCarModels = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API first
      try {
        const response = await carModel3DAPI.getAll();
        const models = response.data.results || response.data || [];
        
        if (models.length > 0) {
          setCarModels(models);
          const firstModel = models[0];
          setSelectedModel(firstModel);
          setAvailableColors(firstModel.default_colors || defaultColors);
          
          // Set first available color as default
          const colors = firstModel.default_colors || defaultColors;
          const firstColor = Object.values(colors)[0];
          if (firstColor) {
            setSelectedColor(firstColor);
          }
          return;
        }
      } catch (apiError) {
        console.warn('API not available, using sample data:', apiError);
      }
      
      // Fallback to sample data if API fails or returns no data
      console.log('Using sample car models for demonstration');
      setCarModels(sampleCarModels);
      
      if (sampleCarModels.length > 0) {
        const firstModel = sampleCarModels[0];
        setSelectedModel(firstModel);
        setAvailableColors(firstModel.default_colors || defaultColors);
        
        // Set first available color as default
        const colors = firstModel.default_colors || defaultColors;
        const firstColor = Object.values(colors)[0];
        if (firstColor) {
          setSelectedColor(firstColor);
        }
      }
      
    } catch (err) {
      console.error('Error fetching car models:', err);
      // Use fallback model as last resort
      setCarModels([fallbackCarModel]);
      setSelectedModel(fallbackCarModel);
      setAvailableColors(fallbackCarModel.default_colors);
      setSelectedColor(Object.values(fallbackCarModel.default_colors)[0]);
      setError('Using demo data. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (modelId) => {
    const model = carModels.find(m => m.id === parseInt(modelId));
    if (model) {
      setSelectedModel(model);
      setAvailableColors(model.default_colors || defaultColors);
      
      // Reset to first color of new model
      const colors = model.default_colors || defaultColors;
      const firstColor = Object.values(colors)[0];
      if (firstColor) {
        setSelectedColor(firstColor);
      }
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-orange-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading 3D Car Models</h2>
          <p className="text-gray-600">Please wait while we prepare your customization experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Models</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchCarModels}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (carModels.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center p-8">
          <Car className="text-gray-400 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Car Models Available</h2>
          <p className="text-gray-600">Please contact the administrator to add 3D car models.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/40 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Car size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">3D Car Customizer</h1>
                <p className="text-gray-600">Choose a car model and customize its color</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm border border-white/40 px-4 py-2 rounded-full text-gray-700 hover:bg-white/70 transition-all duration-300">
                <Share size={18} />
                <span>Share</span>
              </button>
              <button className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300">
                <Download size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Model Selection */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/40">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Car className="mr-2 text-orange-500" size={20} />
                  Car Model
                </h3>
                <select
                  value={selectedModel?.id || ''}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-400 bg-white"
                >
                  {carModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.brand} {model.name}
                    </option>
                  ))}
                </select>
                
                {selectedModel && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">{selectedModel.description}</p>
                  </div>
                )}
              </div>

              {/* Color Selection */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/40">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Palette className="mr-2 text-orange-500" size={20} />
                  Color
                </h3>
                
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(availableColors).map(([colorName, colorValue]) => (
                    <button
                      key={colorName}
                      onClick={() => handleColorChange(colorValue)}
                      className={`relative p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        selectedColor === colorValue
                          ? 'border-orange-500 ring-4 ring-orange-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={colorName}
                    >
                      <div
                        className="w-full h-8 rounded-lg"
                        style={{ backgroundColor: colorValue }}
                      ></div>
                      <p className="text-xs text-gray-600 mt-1 text-center">{colorName}</p>
                    </button>
                  ))}
                </div>
                
                {/* Custom Color Picker */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Color
                  </label>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full h-12 rounded-xl border border-gray-200 cursor-pointer"
                  />
                </div>
              </div>

              {/* Controls Info */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/40">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Controls</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <RotateCcw size={16} />
                    <span>Left mouse: Rotate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ZoomIn size={16} />
                    <span>Scroll: Zoom in/out</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ZoomOut size={16} />
                    <span>Right mouse: Pan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Viewer */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/40 overflow-hidden">
              <div className="h-[600px] lg:h-[700px]">
                {selectedModel ? (
                  <ThreeDCarViewer
                    modelUrl={selectedModel.model_file_url || null}
                    selectedColor={selectedColor}
                    className="h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Car className="text-gray-400 mx-auto mb-4" size={64} />
                      <p className="text-gray-600">Select a car model to view in 3D</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCustomizer3D;
