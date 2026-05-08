import React from 'react';

const AboutPage = () => {
    return (
        <div className="about-us bg-gradient-to-br from-gray-100 via-white to-orange-50 min-h-screen">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl font-bold text-center mb-12 text-black bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                        About Us
                    </h1>
                    
                    <div className="mb-12 bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-white/30">
                        <h2 className="text-3xl font-semibold mb-6 text-black border-b-2 border-orange-200 pb-2">Our Mission</h2>
                        <p className="text-gray-700 leading-relaxed text-lg">
                            We are dedicated to providing high-quality automotive parts and accessories at competitive prices. 
                            Our goal is to be your trusted partner in keeping your vehicle running smoothly and efficiently.
                        </p>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-3xl font-semibold mb-8 text-center text-black">Why Choose Us</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 border border-white/30">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-orange-600 text-xl">⚙️</span>
                                </div>
                                <h3 className="text-xl font-medium mb-3 text-black">Quality Parts</h3>
                                <p className="text-gray-600">Genuine and aftermarket parts from trusted manufacturers.</p>
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 border border-white/30">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-green-600 text-xl">👨‍🔧</span>
                                </div>
                                <h3 className="text-xl font-medium mb-3 text-black">Expert Support</h3>
                                <p className="text-gray-600">Knowledgeable staff to help you find the right parts for your vehicle.</p>
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 border border-white/30">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-purple-600 text-xl">💰</span>
                                </div>
                                <h3 className="text-xl font-medium mb-3 text-black">Competitive Prices</h3>
                                <p className="text-gray-600">Best prices on the market with regular deals and discounts.</p>
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 border border-white/30">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-orange-600 text-xl">🚚</span>
                                </div>
                                <h3 className="text-xl font-medium mb-3 text-black">Fast Shipping</h3>
                                <p className="text-gray-600">Quick delivery to get your vehicle back on the road fast.</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-10 border border-white/30">
                        <h2 className="text-3xl font-semibold mb-6 text-black">Get Started Today</h2>
                        <p className="text-gray-700 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                            Ready to find the perfect parts for your vehicle? Browse our extensive catalog or contact us for assistance.
                        </p>
                        <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg font-medium">
                            Shop Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;