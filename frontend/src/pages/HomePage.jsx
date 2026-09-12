import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Star, 
  TrendingUp, 
  ShieldCheck, 
  Truck, 
  Car,
  Wrench,
  Package,
  Users,
  CheckCircle,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Loader,
  ChevronLeft,
  ChevronRight,
  Zap,
  Award,
  Clock,
  Store,
  Heart,
  ShoppingCart
} from 'lucide-react';
import { sparePartsAPI, shopAPI } from '../services/api';
import SemanticSearchBox from '../components/SemanticSearchBox';

// --- Reusable Components ---

/**
 * Auto-scrolling banner component
 */
const AutoScrollBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const bannerItems = [
    { icon: ShieldCheck, title: "100% Genuine Parts", desc: "Verified authenticity guarantee", color: "from-green-500 to-green-600" },
    { icon: Truck, title: "Fast Delivery", desc: "Island-wide delivery within 24 hours", color: "from-blue-500 to-blue-600" },
    { icon: Award, title: "Best Prices", desc: "Competitive pricing on all parts", color: "from-purple-500 to-purple-600" },
    { icon: Users, title: "Expert Support", desc: "Professional assistance available", color: "from-orange-500 to-orange-600" },
    { icon: Clock, title: "24/7 Service", desc: "Round the clock customer support", color: "from-indigo-500 to-indigo-600" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerItems.length]);

  return (
    <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 py-4 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative">
          <div 
            className="flex transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {bannerItems.map((item, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <div className="flex items-center justify-center space-x-4 text-white">
                  <div className={`p-2 rounded-full bg-gradient-to-r ${item.color}`}>
                    <item.icon size={20} className="text-white" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-lg">{item.title}</span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-300">{item.desc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Dots indicator */}
          <div className="flex justify-center mt-3 space-x-2">
            {bannerItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'bg-orange-500 w-6' : 'bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Animated counter component
 */
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    const startCount = 0;
    const endCount = end;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentCount = Math.floor(progress * (endCount - startCount) + startCount);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [end, duration, isVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`counter-${end}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [end]);

  return (
    <span id={`counter-${end}`} className="font-bold text-3xl text-orange-500">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const PartCard = ({ part, index }) => {
  const isNew = part.condition && part.condition.toLowerCase() === 'new';
  const conditionColors = isNew 
    ? 'bg-green-100 text-green-700' 
    : 'bg-orange-100 text-orange-700';
  const conditionText = isNew ? 'BRAND NEW' : (part.condition || 'USED').toUpperCase();

  return (
    <div 
      className="opacity-0 animate-fadeInUp"
      style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
    >
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
        
        {/* Image Area */}
        <div className="relative h-48 bg-gray-50 flex items-center justify-center p-4">
          <Link to={`/spare-parts/${part.id}`} className="block w-full h-full">
            <img 
              src={part.main_image || '/api/placeholder/400/300'} 
              alt={part.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
          <div className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold rounded-md ${conditionColors}`}>
            {conditionText}
          </div>
          <button className="absolute top-3 right-3 p-1.5 bg-white rounded-full text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors shadow-sm border border-gray-100">
            <Heart size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col flex-grow">
          <Link to={`/spare-parts/${part.id}`} className="block">
            <div className="flex items-center space-x-1.5 mb-2">
              <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded flex items-center space-x-1 border border-green-100">
                <Car size={10} />
                <span>Fits: Universal</span>
              </span>
            </div>
            
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
              OEM: {part.oem_number || 'N/A'}
            </p>
            
            <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
              {part.name}
            </h3>
            
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-4">
              <Star size={12} className="text-yellow-400 fill-current" />
              <span className="font-bold text-gray-700">{parseFloat(part.average_rating || 0).toFixed(1)}</span>
              <span>({part.review_count || 0} reviews)</span>
              <span>•</span>
              <span className="truncate">{part.seller_name || 'Verified Seller'}</span>
            </div>
          </Link>

          {/* Price & Action */}
          <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-50">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">FIXED PRICE</p>
              <p className="text-lg font-bold text-orange-600">
                LKR {parseFloat(part.price || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <button className="p-2.5 bg-gray-50 hover:bg-orange-500 hover:text-white text-gray-700 rounded-lg transition-colors border border-gray-200 hover:border-orange-500">
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

const ShopCard = ({ shop, index }) => (
  <div 
    className="opacity-0 animate-fadeInUp h-full"
    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
  >
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} className="w-full h-full object-contain" />
            ) : (
              <Store className="w-6 h-6 text-orange-500 opacity-80" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 line-clamp-1">{shop.name}</h3>
            <div className="flex items-center space-x-1 text-gray-500 text-xs mt-1">
              <MapPin size={12} />
              <span className="truncate">{shop.address || 'Sri Lanka'}</span>
            </div>
          </div>
        </div>
        {shop.is_verified && (
          <div className="flex items-center space-x-1 text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded text-[10px] font-bold">
            <ShieldCheck size={12} />
            <span>Verified</span>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
        {shop.description || `Specialized automotive services and premium spare parts provided by ${shop.name}. Verified professional garage.`}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">Expertise</span>
        <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">Certified</span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
        <div className="flex items-center space-x-1 text-sm">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-bold text-gray-800">{parseFloat(shop.average_rating || 0).toFixed(1)}</span>
          <span className="text-gray-400">({shop.review_count || 0} reviews)</span>
        </div>
        <Link to={`/shops/${shop.id}`} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm">
          Book Inspection
        </Link>
      </div>
    </div>
  </div>
);


// --- Main HomePage Component ---

const HomePage = () => {
  const [popularParts, setPopularParts] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heroSearchMode, setHeroSearchMode] = useState('traditional'); // 'traditional' or 'semantic'
  const navigate = useNavigate();

  useEffect(() => {
    // Define the async function inside useEffect
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch data in parallel
        const [partsResponse, shopsResponse] = await Promise.all([
          sparePartsAPI.getAll({ ordering: '-average_rating', limit: 6 }),
          shopAPI.getShops({ is_verified: true, limit: 4 })
        ]);
        
        setPopularParts(partsResponse.data.results || []);
        setFeaturedShops(shopsResponse.data.results || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const categories = [
    { name: 'Japan', brands: 'Toyota, Honda, Nissan', imageUrl: 'https://flagcdn.com/w80/jp.png' },
    { name: 'German', brands: 'BMW, Benz, Audi', imageUrl: 'https://flagcdn.com/w80/de.png' },
    { name: 'UK', brands: 'Land Rover, Mini', imageUrl: 'https://flagcdn.com/w80/gb.png' },
    { name: 'Korean', brands: 'Hyundai, Kia', imageUrl: 'https://flagcdn.com/w80/kr.png' },
    { name: 'Indian', brands: 'Suzuki, Tata, Mahindra', imageUrl: 'https://flagcdn.com/w80/in.png' },
    { name: 'USA', brands: 'Ford, Jeep, Tesla', imageUrl: 'https://flagcdn.com/w80/us.png' },
    { name: 'China', brands: 'BYD, Geely, Chery', imageUrl: 'https://flagcdn.com/w80/cn.png' },
    { name: 'Sri Lanka', brands: 'Micro, Local Hubs', imageUrl: 'https://flagcdn.com/w80/lk.png' },
  ];

  const features = [
    { icon: ShieldCheck, title: "Verified Quality", desc: "100% authentic parts with quality guarantee" },
    { icon: Truck, title: "Fast Delivery", desc: "Quick dispatch for urgent orders" },
    { icon: Users, title: "Expert Network", desc: "Connect with certified professionals" }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/parts?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleHeroSemanticSearch = (results) => {
    // Navigate to parts page with semantic search results
    if (results?.results && results.results.length > 0) {
      navigate('/parts', { state: { semanticResults: results } });
    } else {
      navigate('/parts');
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-gray-50">
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 bg-white flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto w-full mt-8">
          {/* Top Tag */}
          <div className="flex items-center justify-center space-x-2 mb-6 animate-fadeInUp">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              Sri Lanka's #1 Automotive Spares Exchange
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6 animate-bounce-in tracking-tight">
            Find Genuine Parts for <br />
            <span className="text-orange-500">Every Vehicle</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 animate-slideInFromBottom">
            Connect with verified sellers and get quality OEM & aftermarket spare parts delivered straight to your doorstep islandwide.
          </p>

          {/* Search Card */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 p-6 md:p-8 max-w-3xl mx-auto mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            
            {/* Search Tabs */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setHeroSearchMode('traditional')}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    heroSearchMode === 'traditional'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Traditional Search
                </button>
                <button
                  onClick={() => setHeroSearchMode('ai')}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    heroSearchMode === 'ai'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Zap size={16} className={heroSearchMode === 'ai' ? 'text-white' : 'text-gray-400'} />
                  <span>AI Search</span>
                </button>
              </div>
            </div>

            {/* Search Input Area */}
            <form onSubmit={handleSearch}>
              <div className="relative mb-4 flex items-center bg-gray-50 rounded-full border border-gray-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                <div className="pl-5 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for parts, brands, models (e.g. Prado Front Shocks, Civic Brake Pads)..."
                  className="w-full py-4 pl-3 pr-4 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-sm md:text-base"
                />
              </div>

              {/* Filters & Action */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <button type="button" className="flex items-center space-x-1.5 px-4 py-2 border border-orange-200 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    <span>Filters</span>
                  </button>
                  <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                    <span>Popular:</span>
                    <a href="#" className="hover:text-orange-500 transition-colors">Toyota</a>
                    <span>•</span>
                    <a href="#" className="hover:text-orange-500 transition-colors">Honda</a>
                    <span>•</span>
                    <a href="#" className="hover:text-orange-500 transition-colors">Nissan</a>
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="border-t border-gray-100 pt-4 flex flex-col md:flex-row items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-500 mb-2 md:mb-0">
                <ShieldCheck size={16} className="text-orange-500" />
                <span>Guaranteed Compatibility Check with VIN or Chassis Code</span>
              </div>
              <Link to="/fitment" className="text-orange-600 font-semibold hover:text-orange-700 flex items-center space-x-1">
                <span>Open Fitment Wizard</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Action Buttons Below Search */}
          <div className="flex flex-wrap justify-center gap-4 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <Link to="/parts" className="flex items-center space-x-2 bg-orange-50 text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-orange-100 transition-colors border border-orange-100">
              <Package size={18} />
              <span>Browse All Spares</span>
            </Link>
            <Link to="/mechanics" className="flex items-center space-x-2 bg-white text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
              <Wrench size={18} />
              <span>Find Verified Mechanics</span>
            </Link>
            <Link to="/add-shop" className="flex items-center space-x-2 bg-white text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
              <Store size={18} className="text-orange-500" />
              <span>Become a Seller</span>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Page Content --- */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader className="animate-spin text-orange-500" size={48} />
          <span className="ml-4 text-lg text-gray-700">Loading...</span>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative inline-flex items-center">
                <AlertTriangle className="mr-2" />
                <span>{error}</span>
            </div>
        </div>
      )}

      {!loading && !error && (
        <>
          

          {/* Browse by Vehicle Origin Section */}
          <section className="py-16 bg-white border-t border-gray-100">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">MANUFACTURER ORIGINS</h3>
                  <h2 className="text-3xl font-bold text-gray-900">Browse by Vehicle Origin</h2>
                </div>
                <div className="mt-4 md:mt-0 text-sm font-medium text-gray-500 flex items-center">
                  <span>100% Genuine Certified Imports</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {categories.map((category, index) => (
                  <div 
                    key={index}
                    className="opacity-0 animate-fadeInUp"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                  >
                    <Link 
                      to={`/spare-parts?category=${category.name.toLowerCase()}`}
                      className="group block bg-white rounded-2xl border border-gray-200 hover:border-orange-500 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50/50 flex items-center justify-center p-2">
                          <img 
                            src={category.imageUrl} 
                            alt={category.name}
                            className="w-full h-full object-contain rounded-full shadow-sm"
                          />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{category.name}</h3>
                        <p className="text-[10px] text-gray-500 mt-1 leading-tight">{category.brands}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DriveDrip Ecosystem Section */}
          <section className="py-20 bg-[#1e2738] text-white">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12">
                <div className="max-w-2xl">
                  <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">DRIVEDRIP ECOSYSTEM</h3>
                  <h2 className="text-4xl font-bold">Engineered for Pure Performance & Trust</h2>
                </div>
                <div className="mt-6 lg:mt-0 max-w-md text-gray-400 text-sm">
                  <p>From verified authentic inventory to real-time 3D part fitment checks, we eliminate guesswork from vehicle maintenance.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-colors flex flex-col h-full group">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                    <Store size={24} className="text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Verified Spare Parts Store</h3>
                  <p className="text-gray-400 text-sm mb-8 flex-grow">
                    Every listing is cross-referenced with manufacturer OEM catalogs and guaranteed by registered automotive parts distributors across the country.
                  </p>
                  <Link to="/parts" className="text-sm font-semibold flex items-center space-x-2 text-white group-hover:text-orange-500 transition-colors">
                    <span>Browse Catalog</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {/* Card 2 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-colors flex flex-col h-full group">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                    <Truck size={24} className="text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">24/7 Islandwide Delivery</h3>
                  <p className="text-gray-400 text-sm mb-8 flex-grow">
                    Rapid dispatch from central Colombo and regional spare hubs directly to your workshop, garage, or home address with live GPS tracking.
                  </p>
                  <Link to="/about" className="text-sm font-semibold flex items-center space-x-2 text-white group-hover:text-orange-500 transition-colors">
                    <span>Track Logistic Hubs</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {/* Card 3 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-colors flex flex-col h-full group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-white/5 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Zap size={24} className="text-orange-500" />
                      </div>
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Flagship Feature</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Modification 3D Preview</h3>
                    <p className="text-gray-400 text-sm mb-8 flex-grow">
                      Mount brake calipers, alloy rims, spoilers, and suspension kits onto interactive 3D vehicle models before you buy. Zero fitment risk.
                    </p>
                    <Link to="/3d-cars" className="text-sm font-semibold flex items-center space-x-2 text-white group-hover:text-orange-500 transition-colors">
                      <span>Launch 3D Studio</span>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Popular Parts Section */}
          {popularParts.length > 0 && (
            <section className="py-20 bg-gray-50 border-t border-gray-100">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                  <div className="mb-6 md:mb-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">LIVE INVENTORY</h3>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Popular Spare Parts</h2>
                  </div>
                  
                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-2">
                    <button className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-900 text-white transition-colors">
                      All Parts
                    </button>
                    <button className="px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-gray-300 transition-colors">
                      Brake Systems
                    </button>
                    <button className="px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-gray-300 transition-colors">
                      Suspension & Steering
                    </button>
                    <button className="px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-gray-300 transition-colors hidden lg:block">
                      Engine Components
                    </button>
                    <button className="px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-gray-300 transition-colors hidden lg:block">
                      Electrical & Sensors
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {popularParts.slice(0, 4).map((part, index) => (
                    <PartCard key={part.id} part={part} index={index} />
                  ))}
                </div>

                {/* Banner CTA */}
                <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-start space-x-4 mb-6 md:mb-0">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-orange-500 border border-orange-100">
                      <Search size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">Can't find your vehicle's specific SKU?</h4>
                      <p className="text-sm text-gray-600">
                        Request custom imports through our Colombo clearing network or ask verified mechanics for stock availability.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <button className="w-full sm:w-auto px-6 py-3 bg-white text-gray-800 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                      Submit Part Request
                    </button>
                    <button className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-sm">
                      Chat With Expert
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

                

          {/* Featured Shops Section */}
          {featuredShops.length > 0 && (
            <section className="py-20 bg-white">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                  <div>
                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">DRIVEDRIP CERTIFIED NETWORK</h3>
                    <h2 className="text-3xl font-bold text-gray-900">Top Rated Workshops & Mechanics</h2>
                  </div>
                  <Link to="/shops" className="mt-4 md:mt-0 text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1">
                    <span>Explore All 240+ Verified Garages</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredShops.slice(0, 3).map((shop, index) => (
                    <ShopCard key={shop.id} shop={shop} index={index} />
                  ))}
                </div>
              </div>
            </section>
          )}

        </>
      )}
    </div>
  );
};

export default HomePage;