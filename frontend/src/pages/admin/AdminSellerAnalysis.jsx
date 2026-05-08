import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/api';
import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Shield, 
  BarChart3,
  Search,
  Eye
} from 'lucide-react';

const AdminSellerAnalysis = () => {
  const { user } = useAuth();
  const [bulkAnalysis, setBulkAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerAnalysis, setSellerAnalysis] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.is_staff) {
      fetchBulkAnalysis();
    }
  }, [user]);

  const fetchBulkAnalysis = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.bulkSellerAnalysis();
      setBulkAnalysis(response.data);
    } catch (error) {
      console.error('Error fetching bulk analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSeller = async (sellerId) => {
    try {
      setAnalyzingId(sellerId);
      const response = await adminAPI.analyzeSellerReputation(sellerId);
      setSellerAnalysis(response.data);
      setSelectedSeller(sellerId);
    } catch (error) {
      console.error('Error analyzing seller:', error);
      alert('Error analyzing seller. Please try again.');
    } finally {
      setAnalyzingId(null);
    }
  };

  if (user?.role !== 'ADMIN' && !user?.is_staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h2>
          <p className="mt-1 text-sm text-gray-500">This page is for admin users only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seller analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Reputation Analysis</h1>
          <p className="mt-2 text-gray-600">AI-powered insights into seller performance and reputation</p>
        </div>

        {/* Bulk Analysis Overview */}
        {bulkAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">{bulkAnalysis.total_sellers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Top Performers</p>
                  <p className="text-2xl font-bold text-gray-900">{bulkAnalysis.top_performers?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Concerning Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">{bulkAnalysis.concerning_sellers?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ecosystem Health</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bulkAnalysis.ecosystem_health || 'N/A'}/10
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                Top Performing Sellers
              </h3>
            </div>
            <div className="p-6">
              {bulkAnalysis?.top_performers?.map((seller, index) => (
                <div key={seller.username} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{seller.username}</p>
                      <p className="text-sm text-gray-500">
                        {seller.rating}/5 • {seller.total_ratings} ratings • {seller.parts} parts
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => analyzeSeller(seller.username)}
                    disabled={analyzingId === seller.username}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
                  >
                    {analyzingId === seller.username ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
                    ) : (
                      <>
                        <Eye className="mr-1 h-3 w-3" />
                        Analyze
                      </>
                    )}
                  </button>
                </div>
              )) || <p className="text-gray-500">No top performers data available</p>}
            </div>
          </div>

          {/* Concerning Sellers */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                Sellers Requiring Attention
              </h3>
            </div>
            <div className="p-6">
              {bulkAnalysis?.concerning_sellers?.map((seller, index) => (
                <div key={seller.username} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{seller.username}</p>
                      <p className="text-sm text-gray-500">
                        {seller.rating}/5 • {seller.total_ratings} ratings • {seller.parts} parts
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => analyzeSeller(seller.username)}
                    disabled={analyzingId === seller.username}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50"
                  >
                    {analyzingId === seller.username ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                    ) : (
                      <>
                        <Eye className="mr-1 h-3 w-3" />
                        Analyze
                      </>
                    )}
                  </button>
                </div>
              )) || <p className="text-gray-500">No concerning sellers identified</p>}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {bulkAnalysis?.key_insights && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h3>
            <div className="space-y-4">
              {bulkAnalysis.key_insights.map((insight, index) => (
                <p key={index} className="text-gray-700">{insight}</p>
              ))}
            </div>
          </div>
        )}

        {/* Individual Seller Analysis Modal */}
        {sellerAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Seller Analysis: {sellerAnalysis.seller_id}
                </h3>
                <button
                  onClick={() => {
                    setSellerAnalysis(null);
                    setSelectedSeller(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Reputation Score */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Overall Reputation Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sellerAnalysis.overall_reputation_score}/10
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sellerAnalysis.trust_level === 'HIGH' 
                      ? 'bg-green-100 text-green-800'
                      : sellerAnalysis.trust_level === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {sellerAnalysis.trust_level} TRUST
                  </div>
                </div>

                {/* Strengths and Concerns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-700 mb-3">Strengths</h4>
                    <ul className="space-y-2">
                      {sellerAnalysis.strengths?.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-700 mb-3">Concerns</h4>
                    <ul className="space-y-2">
                      {sellerAnalysis.concerns?.map((concern, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-red-500 mr-2">⚠</span>
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Detailed Analysis */}
                {sellerAnalysis.detailed_analysis && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Detailed Analysis</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {sellerAnalysis.detailed_analysis}
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {sellerAnalysis.recommendations && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {sellerAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-blue-500 mr-2">→</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSellerAnalysis;
