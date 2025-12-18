import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';

import api, { API_BASE_URL } from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import Loading from '../../components/Loading.jsx';
import { FaPlus, FaMinus, FaTh, FaList } from 'react-icons/fa';
import noImage from '../../assets/No_image.png';
import { useTheme } from '../../context/ThemeContext.jsx';

const ProductSelection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    // Load view preference from localStorage
    return localStorage.getItem('productViewMode') || 'card';
  });
  const { selectedUnit, selectedProducts, adjustProductQuantity } = useOrder();

  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('productViewMode', viewMode);
  }, [viewMode]);

  const fetchProducts = useCallback(async () => {
    if (!selectedUnit) {
      setError('You are not assigned to a unit. Please contact administrator.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Warm up printer connection in the background (ignore failures)
      api.get('/printer/ping').catch((err) => {
        console.warn('[Printer Ping] Kiosk warm-up failed:', err?.message || err);
      });

      const response = await api.get(`/products?unit_id=${selectedUnit.id}&is_active=true`);
      setProducts(response.data);
      if (response.data.length === 0) {
        setError('No products available for your unit.');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedUnit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const productQuantities = useMemo(() => {
    const map = {};
    selectedProducts.forEach((p) => {
      map[p.id] = p.quantity || 1;
    });
    return map;
  }, [selectedProducts]);

  const totalSelectedCount = useMemo(
    () => selectedProducts.reduce((sum, p) => sum + (p.quantity || 1), 0),
    [selectedProducts]
  );

  const handleContinue = () => {
    if (totalSelectedCount === 0) {
      alert('Please select at least one product');
      return;
    }
    navigate('/kiosk/calendar');
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen p-2 sm:p-3 md:p-4 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Select Products</h1>
            <div className="flex gap-3 w-full sm:w-auto">
              {/* View Toggle Buttons */}
              <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-2 flex items-center gap-2 transition-colors ${viewMode === 'card'
                    ? isDark
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <FaTh className="text-sm" />
                  <span className="hidden sm:inline text-sm font-medium">Card</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 flex items-center gap-2 transition-colors ${viewMode === 'list'
                    ? isDark
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <FaList className="text-sm" />
                  <span className="hidden sm:inline text-sm font-medium">List</span>
                </button>
              </div>

              <button
                onClick={handleContinue}
                disabled={totalSelectedCount === 0}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-base font-semibold rounded-lg hover:translate-y-[-1px] transition-colors ${isDark ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Continue ({totalSelectedCount})
              </button>
            </div>
          </div>

          {error ? (
            <div className="text-center py-8 sm:py-12 md:py-16">
              <p className="text-red-500 text-lg sm:text-xl md:text-2xl">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 sm:py-12 md:py-16">
              <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-lg sm:text-xl md:text-2xl`}>No products available</p>
            </div>
          ) : viewMode === 'card' ? (
            // CARD VIEW - Smaller cards, more per row
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
              {products.map((product) => {
                const quantity = productQuantities[product.id] || 0;
                const isSelected = quantity > 0;
                return (
                  <div
                    key={product.id}
                    className={`rounded-lg overflow-hidden hover:shadow-lg transition-all relative border-2 ${isSelected
                      ? isDark
                        ? 'border-amber-400 ring-2 ring-amber-300/70 bg-amber-400/10'
                        : 'border-blue-500 ring-2 ring-blue-300 bg-blue-50'
                      : isDark
                        ? 'border-slate-800 bg-slate-900/70 hover:border-amber-300/60'
                        : 'border-transparent bg-white shadow-md'
                      }`}
                  >
                    <div className={`aspect-square flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      <img
                        src={product.image_path ? `${API_BASE_URL}${product.image_path}` : noImage}
                        alt={product.name_en}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = noImage;
                        }}
                      />
                    </div>
                    <div className="p-1.5 space-y-1">
                      <div className={`text-[10px] sm:text-xs font-semibold line-clamp-2 min-h-[1.5rem] ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        {product.name_en} | {product.name_ta}
                      </div>
                      <div className={`text-sm font-bold ${isDark ? 'text-amber-300' : 'text-blue-600'}`}>
                        ₹{parseFloat(product.price).toFixed(2)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustProductQuantity(product, -1)}
                            className={`w-6 h-6 flex items-center justify-center rounded-md text-xs ${isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                          >
                            <FaMinus />
                          </button>
                          <span className="min-w-[30px] text-center text-sm font-semibold">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => adjustProductQuantity(product, 1)}
                            className={`w-6 h-6 flex items-center justify-center rounded-md text-xs ${isDark ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                          >
                            <FaPlus />
                          </button>
                        </div>
                        {isSelected && (
                          <div className="text-center">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-amber-400/80 text-slate-950' : 'bg-blue-100 text-blue-700'}`}>
                              {quantity}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // LIST VIEW - Horizontal layout
            <div className="space-y-3">
              {products.map((product) => {
                const quantity = productQuantities[product.id] || 0;
                const isSelected = quantity > 0;
                return (
                  <div
                    key={product.id}
                    className={`rounded-lg overflow-hidden hover:shadow-lg transition-all border-2 ${isSelected
                      ? isDark
                        ? 'border-amber-400 ring-2 ring-amber-300/70 bg-amber-400/10'
                        : 'border-blue-500 ring-2 ring-blue-300 bg-blue-50'
                      : isDark
                        ? 'border-slate-800 bg-slate-900/70 hover:border-amber-300/60'
                        : 'border-transparent bg-white shadow-md'
                      }`}
                  >
                    <div className="flex items-center gap-2 p-2">
                      <div className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                        <img
                          src={product.image_path ? `${API_BASE_URL}${product.image_path}` : noImage}
                          alt={product.name_en}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = noImage;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                          {product.name_en} | {product.name_ta} | <span className={isDark ? 'text-amber-300' : 'text-blue-600'}>₹{parseFloat(product.price).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => adjustProductQuantity(product, -1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                          <FaMinus />
                        </button>
                        <span className="min-w-[35px] text-center text-lg font-semibold">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => adjustProductQuantity(product, 1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProductSelection;
