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
  Clock
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

/**
 * Displays a single popular part card with animations.
 */
const PartCard = ({ part, index }) => (
  <div 
    className="opacity-0 animate-fadeInUp"
    style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
  >
    <Link
      to={`/spare-parts/${part.id}`}
      className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-3 hover:scale-105 border border-gray-100"
    >
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img 
          src={part.main_image || '/api/placeholder/400/300'} 
          alt={part.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 text-sm font-medium transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <Star size={14} className="text-yellow-400 fill-current" />
          <span>{parseFloat(part.average_rating || 0).toFixed(1)}</span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors truncate">
          {part.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Rs {parseFloat(part.price || 0).toFixed(2)}
          </span>
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {part.condition}
          </span>
        </div>
      </div>
    </Link>
  </div>
);

/**
 * Displays a single featured shop card.
 */
const ShopCard = ({ shop, index }) => (
  <div 
    className="opacity-0 animate-fadeInUp"
    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
  >
    <Link
      to={`/shops/${shop.id}`}
      className="group block bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-3 hover:scale-105 border border-gray-100"
    >
      <div className="relative h-32 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        {shop.logo ? (
          <img 
            src={shop.logo} 
            alt={shop.name} 
            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg relative z-10"
          />
        ) : (
          <Users className="w-12 h-12 text-white relative z-10 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-3 truncate group-hover:text-orange-600 transition-colors">
          {shop.name}
        </h3>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium text-gray-800">
              {parseFloat(shop.average_rating || 0).toFixed(1)}
            </span>
            <span className="text-gray-500">({shop.review_count || 0})</span>
          </div>
          {shop.is_verified && (
            <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle size={14} />
              <span className="font-medium text-xs">Verified</span>
            </div>
          )}
        </div>
      </div>
    </Link>
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
    { name: 'Japan', imageUrl: 'https://flagcdn.com/w80/jp.png' },
    { name: 'China', imageUrl: 'https://flagcdn.com/w80/cn.png' },
    { name: 'Korean', imageUrl: 'https://flagcdn.com/w80/kr.png' },
    { name: 'Indian', imageUrl: 'https://flagcdn.com/w80/in.png' },
    { name: 'USA', imageUrl: 'https://flagcdn.com/w80/us.png' },
    { name: 'German', imageUrl: 'https://flagcdn.com/w80/de.png' },
    { name: 'UK', imageUrl: 'https://flagcdn.com/w80/gb.png' },
    { name: 'Sri Lanka', imageUrl: 'https://flagcdn.com/w80/lk.png' },
    
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
      {/* Auto-scrolling Banner */}
      <AutoScrollBanner />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('https://tmna.aemassets.toyota.com/is/image/toyota/toyota/homepage/tdr-marquee/2026/MUL_MY26_0005_V001.png?fmt=jpeg&fit=crop&dpr=on,3&wid=1920')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-screen text-center text-white">
          <div className="animate-fadeInUp">
            <h1 className="text-6xl md:text-8xl font-black mb-4 animate-bounce-in">
              Drive<span className="text-orange-500">Drip</span>
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 animate-slideInFromLeft">
              Find <span className="text-orange-500">Genuine Parts</span> for Every Vehicle
            </h2>
            <p className="text-xl text-gray-200 mb-12 max-w-3xl mx-auto animate-slideInFromRight">
              Connect with verified sellers and get quality spare parts delivered to your doorstep
            </p>
          </div>

          <div className="w-full max-w-4xl mx-auto mb-12 animate-slideInFromBottom">
            {/* Search Mode Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 inline-flex border border-white/20">
                <button
                  onClick={() => setHeroSearchMode('traditional')}
                  className={`px-6 py-2 rounded-full transition-all duration-300 font-medium ${
                    heroSearchMode === 'traditional'
                      ? 'text-white hover:bg-white/20'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  Quick Search
                </button>
               
              </div>
            </div>

            
              {/* Traditional Hero Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search parts by name or vehicle model..."
                  className="w-full pl-14 pr-32 py-5 text-lg text-black placeholder-gray-500 border-none rounded-full bg-white/90 focus:outline-none focus:ring-4 focus:ring-orange-400 backdrop-blur-sm transition-all duration-300 focus:bg-white"
                />
                <Search size={24} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Search
                </button>
              </form>
            
          </div>

          <div className="flex flex-wrap justify-center gap-4 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <Link to="/spare-parts" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-full font-semibold hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 flex items-center space-x-2 shadow-lg">
              <Package size={20} />
              <span>Browse Parts</span>
            </Link>
            <Link to="/shops" className="bg-white/10 backdrop-blur-sm text-white border-2 border-orange-300 px-8 py-4 rounded-full font-semibold hover:bg-white/20 hover:scale-105 transition-all duration-300 flex items-center space-x-2">
              <Users size={20} />
              <span>Find Sellers</span>
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
          

          {/* Vehicle Categories Section */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Vehicle Categories</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">Find parts for vehicles from different regions and manufacturers.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
                {categories.map((category, index) => (
                  <div 
                    key={index}
                    className="opacity-0 animate-fadeInUp"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                  >
                    <Link 
                      to={`/spare-parts?category=${category.name.toLowerCase()}`}
                      className="group block bg-gray-50 rounded-3xl shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105"
                    >
                      <div className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden group-hover:scale-110 transition-all duration-300 border-4 border-orange-100 group-hover:border-orange-200 flex items-center justify-center">
                          <img 
                            src={category.imageUrl} 
                            alt={category.name}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{category.name}</h3>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Our Services Section */}
                <section className="py-20 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">What We Provide</h2>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">Experience the difference with our premium platform designed for automotive excellence.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div 
                    className="text-center opacity-0 animate-fadeInUp"
                    style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
                  >
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                    <Package size={40} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Spare Parts Store</h3>
                    <p className="text-gray-300 text-lg">Comprehensive collection of genuine automotive parts for all vehicle makes and models</p>
                  </div>
                  
                  <div 
                    className="text-center opacity-0 animate-fadeInUp"
                    style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
                  >
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                    <Clock size={40} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">24/7 Delivery</h3>
                    <p className="text-gray-300 text-lg">Round-the-clock delivery service ensuring you get your parts whenever you need them</p>
                  </div>
                  
                  <div 
                    className="text-center opacity-0 animate-fadeInUp"
                    style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
                  >
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                    <Zap size={40} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Modification 3D Preview</h3>
                    <p className="text-gray-300 text-lg">Advanced 3D visualization technology to preview parts and modifications before purchase</p>
                  </div>
                  </div>
                </div>
                </section>

                {/* Popular Parts Section */}
                {popularParts.length > 0 && (
                <section className="py-20 bg-gray-100">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-12">
                    <div className="text-center md:text-left mb-6 md:mb-0">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Popular Parts</h2>
                    <p className="text-lg text-gray-600">Most popular spare parts chosen by customers.</p>
                    </div>
                    <Link to="/spare-parts" className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 shadow-lg">
                    <span>View All</span>
                    <ArrowRight size={16} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {popularParts.slice(0, 6).map((part, index) => (
                    <PartCard key={part.id} part={part} index={index} />
                    ))}
                  </div>
                  </div>
                </section>
                )}

                

          {/* Featured Shops Section */}
                {featuredShops.length > 0 && (
                <section className="py-20 bg-white">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Trusted Sellers</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">Partner with our network of verified and highly-rated professionals.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredShops.slice(0, 4).map((shop, index) => (
                    <ShopCard key={shop.id} shop={shop} index={index} />
                    ))}
                  </div>
                  <div className="text-center mt-16">
                    <Link to="/shops" className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-full font-semibold hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 shadow-lg">
                      <span>View All Shops</span>
                      <ArrowRight size={18} />
                    </Link>
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