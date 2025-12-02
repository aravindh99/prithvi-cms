import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api, { API_BASE_URL } from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import Loading from '../../components/Loading.jsx';
import { FaCheckCircle, FaSignOutAlt } from 'react-icons/fa';
import noImage from '../../assets/No_image.png';

const ProductSelection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { selectedUnit, selectedProducts, toggleProduct } = useOrder();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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

  const isProductSelected = (productId) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const handleContinue = () => {
    if (selectedProducts.length === 0) {
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
      <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Select Products</h1>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
              >
                <FaSignOutAlt /> Logout
              </button>
              <button
                onClick={handleContinue}
                disabled={selectedProducts.length === 0}
                className="flex-1 sm:flex-none bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue ({selectedProducts.length} selected)
              </button>
            </div>
          </div>

          {error ? (
            <div className="text-center py-8 sm:py-12 md:py-16">
              <p className="text-red-600 text-lg sm:text-xl md:text-2xl">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 sm:py-12 md:py-16">
              <p className="text-gray-600 text-lg sm:text-xl md:text-2xl">No products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {products.map((product) => {
                const isSelected = isProductSelected(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product)}
                    className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all relative border-2 ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1 z-10">
                        <FaCheckCircle className="text-white text-sm" />
                      </div>
                    )}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center h-24">
                      <img
                        src={product.image_path ? `${API_BASE_URL}${product.image_path}` : noImage}
                        alt={product.name_en}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = noImage;
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-800 mb-1 line-clamp-2">
                        {product.name_en} | {product.name_ta}
                      </div>
                      <div className="text-sm font-bold text-blue-600">₹{parseFloat(product.price).toFixed(2)}</div>
                    </div>
                  </button>
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

