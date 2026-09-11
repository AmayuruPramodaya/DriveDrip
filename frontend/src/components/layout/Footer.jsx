import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Car, 
    Facebook, 
    Instagram, 
    Phone, 
    ShieldCheck, 
    MessageSquare,
    Youtube,
    Linkedin
} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { href: "https://facebook.com/drivedrip", label: "Facebook", icon: Facebook },
        { href: "https://instagram.com/drivedrip", label: "Instagram", icon: Instagram },
        { href: "https://linkedin.com/company/drivedrip", label: "LinkedIn", icon: Linkedin },
        { href: "https://youtube.com/c/drivedrip", label: "YouTube", icon: Youtube }
    ];

    return (
        <footer className="bg-[#0f172a] text-white py-16 w-full mt-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                                <Car size={20} className="text-white" />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">
                                Drive<span className="text-orange-500">Drip</span>
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Sri Lanka's premier automotive spare parts exchange. Connecting drivers with verified mechanics and genuine OEM imports.
                        </p>
                        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-2 rounded-lg w-fit">
                            <ShieldCheck size={16} className="text-green-500" />
                            <span className="text-xs font-semibold text-gray-300">Trusted by 10,000+ Mechanics</span>
                        </div>
                    </div>

                    {/* Platform Column */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Platform</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/spare-parts" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                                    Browse Parts
                                </Link>
                            </li>
                            <li>
                                <Link to="/shops" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                                    Find Mechanics
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                                    Become a Seller
                                </Link>
                            </li>
                            <li>
                                <Link to="/returns" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                                    Return Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Support Column */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Legal & Support</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/terms" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/help" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Direct Assistance Column */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Direct Assistance</h3>
                        <p className="text-sm text-gray-400 mb-6">Need help with part fitment or logistics tracking?</p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 transition-colors">
                                    <Phone size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Call Us</p>
                                    <p className="text-sm font-bold text-gray-200">011 234 5678</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-green-500 group-hover:border-green-500 transition-colors">
                                    <MessageSquare size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">WhatsApp</p>
                                    <p className="text-sm font-bold text-gray-200">077 123 4567</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <p className="text-sm text-gray-500">
                        © {currentYear} DriveDrip Exchange. All rights reserved.
                    </p>
                    
                    {/* Social Media Links */}
                    <div className="flex items-center space-x-4">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-white transition-colors"
                                aria-label={`Visit our ${social.label} page`}
                            >
                                <social.icon size={20} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;