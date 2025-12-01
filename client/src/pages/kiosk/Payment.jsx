import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import Loading from '../../components/Loading.jsx';
import upiIcon from '../../assets/upi.png';
import { FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';

const Payment = () => {
  const { selectedUnit, selectedProducts, selectedDates, calculatePerDayTotal, calculateGrandTotal, setCurrentOrder } = useOrder();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const deletePendingOrder = async (orderId) => {
    if (!orderId) return;
    try {
      await api.delete(`/orders/${orderId}`);
    } catch (error) {
      console.error('Failed to delete pending order:', error);
      // Continue anyway - order might already be deleted
    }
  };

  const handleBack = async () => {
    if (orderId) {
      await deletePendingOrder(orderId);
      setOrderId(null);
    }
    navigate('/kiosk/products');
  };

  const perDayTotal = calculatePerDayTotal();
  const grandTotal = calculateGrandTotal();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const createOrder = async () => {
    try {
      setLoading(true);
      const productIds = selectedProducts.map(p => p.id);
      const response = await api.post('/orders', {
        product_ids: productIds,
        selected_dates: selectedDates,
        payment_mode: 'PENDING'
      });

      setOrderId(response.data.order.id);
      setCurrentOrder(response.data.order);
      return response.data.order.id;
    } catch (error) {
      console.error('Create order error:', error);
      alert('Failed to create order. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUPIPayment = async () => {
    const orderId = await createOrder();
    if (!orderId) return;

    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please wait...');
      await deletePendingOrder(orderId);
      setOrderId(null);
      navigate('/kiosk/products'); // Navigate to products page
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/orders/${orderId}/create-razorpay-order`);
      const { order_id, amount, key } = response.data;

      const options = {
        key: key,
        amount: amount,
        currency: 'INR',
        name: 'Prithvi CMS',
        description: `Order #${orderId}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            const verifyResponse = await api.post(`/orders/${orderId}/verify-razorpay`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setOrderId(null); // Clear orderId on success
            navigate('/kiosk/success', { state: { order: verifyResponse.data.order, printResults: verifyResponse.data.printResults } });
          } catch (error) {
            console.error('Payment verification error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            // Check if payment succeeded but printing failed
            if (error.response?.status === 500 && error.response?.data?.order) {
              // Payment succeeded but printing failed - order is saved, admin can retry print
              console.log('[Payment] Payment succeeded but printing failed. Order saved:', error.response.data.order.id);
              setOrderId(null);
              setLoading(false);
              navigate('/kiosk/success', { 
                state: { 
                  order: error.response.data.order, 
                  printResults: error.response.data.printResults,
                  printWarning: true 
                } 
              });
            } else {
              // Payment verification failed - order was deleted
              console.log('[Payment] Payment verification failed. Order deleted.');
              setOrderId(null);
              alert(error.response?.data?.error || 'Payment verification failed. Order has been cancelled. Please try again.');
              setLoading(false);
              navigate('/kiosk/products'); // Navigate to products page on failure
            }
          }
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: async function() {
            // User cancelled payment - delete the order
            await deletePendingOrder(orderId);
            setOrderId(null);
            setLoading(false);
            navigate('/kiosk/products'); // Navigate to products page on cancellation
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('UPI payment error:', error);
      await deletePendingOrder(orderId);
      setOrderId(null);
      alert(error.response?.data?.error || 'Failed to initiate payment. Please try again.');
      setLoading(false);
      navigate('/kiosk/products'); // Navigate to products page on failure
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
      <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Payment</h1>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleBack}
                className="bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
              >
                <FaArrowLeft /> Back
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex justify-between text-sm sm:text-base md:text-lg">
                    <span className="flex-1 pr-2">{product.name_en} | {product.name_ta}</span>
                    <span className="font-semibold whitespace-nowrap">₹{parseFloat(product.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-base sm:text-lg md:text-xl">
                  <span>Per Day Total:</span>
                  <span className="font-bold">₹{perDayTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg md:text-xl">
                  <span>Days Selected:</span>
                  <span className="font-bold">{selectedDates.length}</span>
                </div>
                <div className="flex justify-between text-xl sm:text-2xl font-bold text-green-600 pt-2 border-t">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Select Payment Mode</h2>
              
              <button
                onClick={handleUPIPayment}
                className="w-full bg-white border-2 border-blue-500 rounded-xl p-4 sm:p-6 hover:bg-blue-50 transition-colors flex items-center justify-center gap-3 sm:gap-4"
              >
                <img src={upiIcon} alt="UPI" className="h-8 sm:h-10 md:h-12" />
                <span className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">UPI / Razorpay</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Payment;

