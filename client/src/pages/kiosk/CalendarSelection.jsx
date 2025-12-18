import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Layout from '../../components/Layout.jsx';
import Loading from '../../components/Loading.jsx';
import api from '../../config/api.js';
import { FaArrowLeft } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext.jsx';

// Helper to format a JS Date as YYYY-MM-DD using local time (no UTC shift)
const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const CalendarSelection = () => {
  const { selectedDates, setSelectedDates, selectedProducts, calculatePerDayTotal, setCurrentOrder } = useOrder();

  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState([]);
  const [selectAllMonth, setSelectAllMonth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { isDark } = useTheme();



  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  useEffect(() => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    // Load Razorpay script only if not already present
    let script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        setRazorpayLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        alert('Payment gateway failed to load. Please refresh the page.');
      };
      document.head.appendChild(script);
    } else {
      // Script exists, check if Razorpay is available
      const checkRazorpay = () => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
        } else {
          setTimeout(checkRazorpay, 100);
        }
      };
      checkRazorpay();
    }

    return () => {
      // Don't remove script on unmount as it might be used by other components
    };
  }, []);

  // Keep select-all checkbox in sync with current month + selectedDates
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      const isBlocked = isDateBlocked(date);

      if (date.getDay() !== 0 && !isBlocked) {
        monthDates.push(toLocalDateString(date));
      }
    }

    const allSelected = monthDates.length > 0 && monthDates.every(d => selectedDates.includes(d));
    setSelectAllMonth(allSelected);
  }, [currentMonth, selectedDates]);

  const isDateBlocked = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Strictly past dates are always blocked
    if (checkDate < today) return true;

    // Today is blocked if time is > 10:30 AM
    if (checkDate.getTime() === today.getTime()) {
      const now = new Date();
      // Check if time is > 10:30
      if (now.getHours() > 10 || (now.getHours() === 10 && now.getMinutes() > 30)) {
        return true;
      }
    }

    return false;
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendarDays.push(date);
    }

    setDays(calendarDays);
  };

  const toggleDate = (date) => {
    if (!date) return;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    // Use unified blocking logic
    if (isDateBlocked(date)) return;

    const dateStr = toLocalDateString(date);
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    return selectedDates.includes(toLocalDateString(date));
  };

  const isSunday = (date) => {
    if (!date) return false;
    return date.getDay() === 0;
  };

  const handleToggleSelectAll = (event) => {
    const checked = event.target.checked;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      const isBlocked = isDateBlocked(date);

      if (date.getDay() !== 0 && !isBlocked) {
        monthDates.push(toLocalDateString(date));
      }
    }

    if (checked) {
      // Merge current month dates with any existing selections from other months
      const otherDates = selectedDates.filter(d => !monthDates.includes(d));
      setSelectedDates([...otherDates, ...monthDates]);
      setSelectAllMonth(true);
    } else {
      // Clear only current month selections, keep other months
      const remaining = selectedDates.filter(d => !monthDates.includes(d));
      setSelectedDates(remaining);
      setSelectAllMonth(false);
    }
  };

  const cancelPendingOrder = async (orderId) => {
    if (!orderId) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
    } catch (error) {
      console.error('Failed to cancel pending order:', error);
    }
  };

  const createOrder = async () => {
    try {
      const productIds = selectedProducts.flatMap(p =>
        Array(p.quantity || 1).fill(p.id)
      );

      console.log('Creating order with:', { productIds, selectedDates });

      const response = await api.post('/orders', {
        product_ids: productIds,
        selected_dates: selectedDates,
        // Kiosk always creates UPI orders
        payment_mode: 'UPI'
      });

      setOrderId(response.data.order.id);
      setCurrentOrder(response.data.order);
      return response.data.order.id;
    } catch (error) {
      console.error('Create order error:', error);
      alert('Failed to create order. Please try again.');
      setLoading(false);
      return null;
    }
  };

  const handlePaymentInitiation = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      navigate('/kiosk/products');
      return;
    }

    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }

    // Check Razorpay availability first to avoid creating order unnecessarily
    if (!razorpayLoaded) {
      alert('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);

    try {
      // Create order and Razorpay order in parallel for faster processing
      const orderId = await createOrder();
      if (!orderId) return;

      console.log('Order created successfully:', orderId);

      const response = await api.post(`/orders/${orderId}/create-razorpay-order`);
      const { order_id, amount, key } = response.data;

      console.log('Razorpay order created:', order_id);

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
            // Check if payment succeeded but printing failed
            if (error.response?.status === 500 && error.response?.data?.order) {
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
              setOrderId(null);
              alert(error.response?.data?.error || 'Payment verification failed. Please try again.');
              setLoading(false);
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
          ondismiss: async function () {
            // User cancelled payment
            await cancelPendingOrder(orderId);
            setOrderId(null);
            setLoading(false);
          }
        }
      };

      // Clear loading state before opening Razorpay
      setLoading(false);

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      await cancelPendingOrder(orderId);
      setOrderId(null);
      alert(error.response?.data?.error || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const handleContinue = () => {
    handlePaymentInitiation();
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const perDayTotal = calculatePerDayTotal();
  const grandTotal = perDayTotal * selectedDates.length;

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen p-2 sm:p-2.5 md:p-3 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-3.5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/kiosk/products')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg hover:translate-y-[-1px] transition-colors flex items-center gap-2 ${isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
              >
                <FaArrowLeft /> Back
              </button>
              <h1 className="text-base sm:text-lg font-bold">Select Dates</h1>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {/* <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
              >
                <FaSignOutAlt /> Logout
              </button> */}
              <button
                onClick={handleContinue}
                disabled={selectedDates.length === 0 || loading}
                className={`flex-1 sm:flex-none px-3 sm:px-3.5 py-1.5 sm:py-2 text-sm font-semibold rounded-lg hover:translate-y-[-1px] transition-colors ${isDark ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : `Continue (${selectedDates.length} days)`}
              </button>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg shadow-black/10 p-2.5 sm:p-3 border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 ">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <button
                  onClick={previousMonth}
                  className={`text-sm sm:text-base font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  ‹
                </button>
                <h2 className="text-sm sm:text-base font-semibold tracking-tight">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <button
                  onClick={nextMonth}
                  className={`text-sm sm:text-base font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  ›
                </button>
              </div>
              <label className={`flex items-center gap-2 text-[8px] sm:text-xs ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={selectAllMonth}
                  onChange={handleToggleSelectAll}
                  className="!min-h-0 !min-w-0 w-7 h-7 appearance-none border border-gray-300 rounded checked:bg-amber-400 cursor-pointer"
                />
                <span>Select all </span>
              </label>
            </div>

            <div className="grid grid-cols-7 gap-y-1 sm:gap-y-1.5">
              {dayNames.map((day) => (
                <div key={day} className={`mr-5 text-center font-semibold py-[3px] text-[11px] sm:text-[12px] ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-17 w-17"></div>;
                }

                const dateStr = toLocalDateString(date);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today to midnight
                const checkDate = new Date(date);
                checkDate.setHours(0, 0, 0, 0);

                // Disable if Sunday OR if date is blocked (past or today > 10:30 AM)
                const isBlocked = isDateBlocked(date);
                const sunday = isSunday(date);
                const isDisabled = sunday || isBlocked;
                const selected = isDateSelected(date);

                return (
                  <button
                    key={dateStr}
                    onClick={() => !isDisabled && toggleDate(date)}
                    disabled={isDisabled}
                    className={`h-17 w-17 rounded-md text-[11px] sm:text-[12px] font-semibold transition-all ${isDisabled
                      ? isDark ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : selected
                        ? isDark ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30' : 'bg-blue-600 text-white shadow-md'
                        : isDark ? 'bg-slate-900 text-slate-100 hover:bg-slate-800' : 'bg-gray-50 text-gray-700 hover:bg-blue-100'
                      }`}
                    style={{ boxShadow: !isDisabled && !selected ? '0 1px 4px rgba(0,0,0,0.08)' : undefined }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`rounded-xl shadow-md p-3 sm:p-3.5 border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-[13px] sm:text-sm">
              <div className="p-2 rounded-lg" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                <div className={`text-[10px] sm:text-[11px] mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Per Day Total</div>
                <div className={`text-lg font-bold ${isDark ? 'text-amber-300' : 'text-blue-600'}`}>₹{perDayTotal.toFixed(2)}</div>
              </div>
              <div className="p-2 rounded-lg" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                <div className={`text-[10px] sm:text-[11px] mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Selected Days</div>
                <div className="text-lg font-bold">{selectedDates.length}</div>
              </div>
              <div className="p-2 rounded-lg" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                <div className={`text-[10px] sm:text-[11px] mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Grand Total</div>
                <div className={`text-lg font-bold ${isDark ? 'text-emerald-300' : 'text-green-600'}`}>₹{grandTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CalendarSelection;

