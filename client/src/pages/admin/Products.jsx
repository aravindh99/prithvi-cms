import { useState, useEffect, useCallback } from 'react';
import api, { API_BASE_URL } from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import AdminNavbar from '../../components/AdminNavbar.jsx';
import Loading from '../../components/Loading.jsx';
import { FaEdit, FaTrash, FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import noImage from '../../assets/No_image.png';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ta: '',
    price: '',
    unit_id: '',
    is_active: true,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      const response = await api.get('/units');
      setUnits(response.data);
    } catch (error) {
      console.error('Fetch units error:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchUnits();
  }, [fetchProducts, fetchUnits]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name_en: product.name_en,
        name_ta: product.name_ta,
        price: product.price,
        unit_id: product.unit_id,
        is_active: product.is_active,
        image: null
      });
      const imageUrl = product.image_path ? `${API_BASE_URL}${product.image_path}` : null;
      setImagePreview(imageUrl);
    } else {
      setEditingProduct(null);
      setFormData({
        name_en: '',
        name_ta: '',
        price: '',
        unit_id: '',
        is_active: true,
        image: null
      });
      setImagePreview(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name_en: '',
      name_ta: '',
      price: '',
      unit_id: '',
      is_active: true,
      image: null
    });
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name_en', formData.name_en);
      formDataToSend.append('name_ta', formData.name_ta);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('unit_id', formData.unit_id);
      formDataToSend.append('is_active', formData.is_active);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/products', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      handleCloseModal();
      fetchProducts();
    } catch (error) {
      console.error('Save product error:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Delete product error:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name_en', product.name_en);
      formDataToSend.append('name_ta', product.name_ta);
      formDataToSend.append('price', product.price);
      formDataToSend.append('unit_id', product.unit_id);
      formDataToSend.append('is_active', !product.is_active);

      await api.put(`/products/${product.id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchProducts();
    } catch (error) {
      console.error('Toggle active error:', error);
      alert('Failed to update product. Please try again.');
    }
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
      <AdminNavbar />
      <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Products</h1>
            <button
              onClick={() => handleOpenModal()}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <FaPlus /> Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image_path ? `${API_BASE_URL}${product.image_path}` : noImage}
                    alt={product.name_en}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = noImage;
                    }}
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-1">
                    {product.name_en} | {product.name_ta}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">₹{parseFloat(product.price).toFixed(2)}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Unit: {product.unit?.name}</div>
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="flex-1 bg-blue-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <FaEdit /> <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center ${
                        product.is_active ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {product.is_active ? <FaToggleOn className="text-xl sm:text-2xl" /> : <FaToggleOff className="text-xl sm:text-2xl" />}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-600"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Name (English)</label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Name (Tamil)</label>
                    <input
                      type="text"
                      value={formData.name_ta}
                      onChange={(e) => setFormData({ ...formData, name_ta: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Unit</label>
                    <select
                      value={formData.unit_id}
                      onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Image</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="mt-2 h-32 object-cover rounded-lg" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <label className="text-gray-700 font-medium">Active</label>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      {editingProduct ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Products;

