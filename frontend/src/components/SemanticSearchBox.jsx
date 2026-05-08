import React, { useState } from 'react';
import { Search, Sparkles, Lightbulb } from 'lucide-react';
import { sparePartsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const SemanticSearchBox = ({ onResults, className = "" }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const navigate = useNavigate();

  const handleSemanticSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await sparePartsAPI.semanticSearch(query.trim());
      setSearchResults(response.data);
      if (onResults) {
        onResults(response.data);
      }
    } catch (error) {
      console.error('Semantic search error:', error);
      // Fallback to regular search
      try {
        const fallbackResponse = await sparePartsAPI.searchParts({ q: query.trim() });
        const fallbackData = {
          results: fallbackResponse.data,
          search_type: 'fallback',
          search_query: query.trim()
        };
        setSearchResults(fallbackData);
        if (onResults) {
          onResults(fallbackData);
        }
      } catch (fallbackError) {
        console.error('Fallback search error:', fallbackError);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSemanticSearch();
    }
  };

  const exampleQueries = [
    "my car makes grinding noise when I brake",
    "engine won't start in cold weather",
    "steering wheel shakes at high speed",
    "car pulls to the right when driving",
    "squealing noise from under the hood"
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center px-4 py-3 text-gray-400">
            <Sparkles className="w-5 h-5 mr-2 text-orange-500" />
            <span className="text-xs font-medium text-orange-500">AI</span>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your car problem or search for parts..."
            className="flex-1 px-2 py-3 text-gray-900 placeholder-gray-500 focus:outline-none"
            disabled={isSearching}
          />
          <button
            onClick={handleSemanticSearch}
            disabled={!query.trim() || isSearching}
            className="px-6 py-3 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </button>
        </div>
        
        {/* AI Badge */}
        <div className="absolute -top-2 left-6 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          AI-Powered
        </div>
      </div>

      {/* Example Queries */}
      <div className="mt-4">
        <div className="flex items-center space-x-2 mb-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-600">Try these smart searches:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => setQuery(example)}
              className="text-xs bg-gray-100 hover:bg-orange-50 hover:text-orange-700 px-3 py-1 rounded-full text-gray-600 transition-colors border border-gray-200 hover:border-orange-200"
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Preview */}
      {searchResults && (
        <div className="mt-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Search Results ({searchResults.results_count || searchResults.results?.length || 0})
            </h3>
            <div className="flex items-center space-x-2">
              {searchResults.search_type === 'semantic' && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  AI Enhanced
                </span>
              )}
              {searchResults.ai_interpretation && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Intent: {searchResults.ai_interpretation.search_intent}
                </span>
              )}
            </div>
          </div>

          {/* AI Interpretation */}
          {searchResults.ai_interpretation && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>AI Understanding:</strong> {searchResults.ai_interpretation.problem_description}
              </p>
              {searchResults.ai_interpretation.suggested_keywords && (
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Keywords:</strong> {searchResults.ai_interpretation.suggested_keywords.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.results?.slice(0, 6).map((part) => (
              <div
                key={part.id}
                onClick={() => navigate(`/parts/${part.id}`)}
                className="border border-gray-200 rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                  {part.main_image ? (
                    <img
                      src={part.main_image.startsWith('http') ? part.main_image : `http://localhost:8000${part.main_image}`}
                      alt={part.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-sm text-gray-900 truncate">{part.name}</h4>
                <p className="text-orange-600 font-semibold text-sm">Rs {part.price}</p>
                <div className="flex items-center mt-1">
                  <div className="flex text-yellow-400 text-xs">
                    {'★'.repeat(Math.floor(part.average_rating || 0))}
                    {'☆'.repeat(5 - Math.floor(part.average_rating || 0))}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">
                    ({part.total_ratings || 0})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {searchResults.results?.length > 6 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate(`/parts?q=${encodeURIComponent(query)}`)}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                View all {searchResults.results_count || searchResults.results.length} results →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SemanticSearchBox;
