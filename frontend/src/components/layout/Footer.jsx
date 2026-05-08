import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Car, 
    ShieldCheck, 
    FileText, 
    Facebook, 
    Twitter, 
    Instagram, 
    Phone, 
    Mail, 
    Package,
    Users
} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { href: "https://facebook.com/drivedrip", label: "Facebook", icon: Facebook },
        { href: "https://twitter.com/drivedrip", label: "Twitter", icon: Twitter },
        { href: "https://instagram.com/drivedrip", label: "Instagram", icon: Instagram }
    ];

    return (
        <footer className="bg-gradient-to-br from-gray-900 to-black text-white py-12 w-full mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Brand */}
                    <div>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-black flex items-center justify-center shadow-lg">
                                <Car size={24} className="text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">
                                Drive<span className="text-orange-500">Drip</span>
                            </span>
                        </div>
                        <p className="text-gray-300 mb-4">
                            Your trusted marketplace for quality vehicle spare parts.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/spare-parts" className="text-gray-300 hover:text-orange-400 transition-colors">
                                    Browse Parts
                                </Link>
                            </li>
                            <li>
                                <Link to="/shops" className="text-gray-300 hover:text-orange-400 transition-colors">
                                    Find Shops
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="text-gray-300 hover:text-orange-400 transition-colors">
                                    Become a Seller
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-gray-300 hover:text-orange-400 transition-colors">
                                    Sign In
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support & Contact */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/contact" className="text-gray-300 hover:text-orange-400 transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-300 hover:text-orange-400 transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-gray-300 hover:text-orange-400 transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                        
                        <div className="mt-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-300 mb-2">
                                <Mail size={16} className="text-orange-400" />
                                <span>support@drivedrip.com</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                <Phone size={16} className="text-orange-400" />
                                <span>+94 11 234 5678</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-8 pt-8 border-t border-gray-700/50 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-400">
                            © {currentYear} Akatsuki. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full">
                            <ShieldCheck size={14} className="text-green-400" />
                            <span className="text-sm text-green-400">Secure & Trusted</span>
                        </div>
                    </div>
                    
                    {/* Social Media Links */}
                    <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-400 mr-3">Follow us:</span>
                        <div className="flex space-x-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all duration-300 hover:scale-110"
                                    aria-label={`Visit our ${social.label} page`}
                                >
                                    <social.icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;