import { useState, useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import AdminNavbar from '../../components/AdminNavbar.jsx';
import Loading from '../../components/Loading.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../config/api.js';

// Helper to format a JS Date as YYYY-MM-DD using local time (no UTC shift)
const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const AdminCheckout = () => {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [paymentMode, setPaymentMode] = useState('CASH'); // CASH | FREE | GUEST
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // prevent double submits

  // Calendar state (similar to kiosk, but compact)
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState([]);
  const [selectAllMonth, setSelectAllMonth] = useState(false);

  // Fetch all units on component mount
  useEffect(() => {
    const loadUnits = async () => {
      try {
        const response = await api.get('/units');
        setUnits(response.data);
        if (response.data.length > 0) {
          setSelectedUnitId(response.data[0].id);
        }
      } catch (error) {
        console.error('Admin checkout units error:', error);
        alert('Failed to load units.');
      }
    };

    loadUnits();
  }, []);

  // Load products when selected unit changes
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        if (!selectedUnitId) {
          setProducts([]);
          return;
        }
        // Warm up printer connection for the selected unit (ignore failures)
        api
          .get(`/printer/ping${selectedUnitId ? `?unit_id=${selectedUnitId}` : ''}`)
          .catch((err) => {
            console.warn('[Printer Ping] Admin warm-up failed:', err?.message || err);
          });

        const response = await api.get(`/products?unit_id=${selectedUnitId}&is_active=true`);
        setProducts(response.data);
        // Clear selected products when unit changes
        setSelectedProducts([]);
      } catch (error) {
        console.error('Admin checkout products error:', error);
        alert('Failed to load products for admin checkout.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedUnitId]);

  const toggleProduct = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendarDays.push(date);
    }

    setDays(calendarDays);
  };

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  // Keep select-all checkbox in sync with current month + selectedDates
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0) {
        monthDates.push(toLocalDateString(date));
      }
    }

    const allSelected =
      monthDates.length > 0 && monthDates.every((d) => selectedDates.includes(d));
    setSelectAllMonth(allSelected);
  }, [currentMonth, selectedDates]);

  const toggleDate = (date) => {
    if (!date) return;
    const dateStr = toLocalDateString(date);
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
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

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleToggleSelectAll = (event) => {
    const checked = event.target.checked;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0) {
        monthDates.push(toLocalDateString(date));
      }
    }

    if (checked) {
      const otherDates = selectedDates.filter((d) => !monthDates.includes(d));
      setSelectedDates([...otherDates, ...monthDates]);
      setSelectAllMonth(true);
    } else {
      const remaining = selectedDates.filter((d) => !monthDates.includes(d));
      setSelectedDates(remaining);
      setSelectAllMonth(false);
    }
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSubmit = async () => {
    if (!selectedUnitId) {
      alert('Please select a unit');
      return;
    }
    if (!selectedProducts.length) {
      alert('Select at least one product');
      return;
    }
    if (!selectedDates.length) {
      alert('Select at least one date');
      return;
    }

    try {
      setSubmitting(true);
      const product_ids = selectedProducts.map((p) => p.id);
      // Use the selected payment mode directly: CASH, FREE, or GUEST
      const initialMode = paymentMode;

      const createRes = await api.post('/orders', {
        product_ids,
        selected_dates: selectedDates,
        payment_mode: initialMode,
        unit_id: selectedUnitId
      });

      const orderId = createRes.data.order.id;

      if (paymentMode === 'CASH') {
        await api.post(`/orders/${orderId}/pay-cash`);
      } else if (paymentMode === 'FREE') {
        await api.post(`/orders/${orderId}/pay-free`);
      } else if (paymentMode === 'GUEST') {
        await api.post(`/orders/${orderId}/pay-guest`);
      }

      alert('Admin bill created successfully. Check logs for details.');
      setSelectedProducts([]);
      setSelectedDates([]);
    } catch (error) {
      console.error('Admin checkout error:', error);
      alert(error.response?.data?.error || 'Failed to create admin bill. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && products.length === 0) {
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-6 md:mb-8">
            Admin Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Unit
                </label>
                <select
                  value={selectedUnitId || ''}
                  onChange={(e) => setSelectedUnitId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">-- Select Unit --</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                Select Products
              </h2>
              {!selectedUnitId ? (
                <p className="text-sm text-gray-500">Please select a unit to view products.</p>
              ) : products.length === 0 ? (
                <p className="text-sm text-gray-500">No products found for this unit.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-96 overflow-y-auto">
                  {products.map((product) => {
                    const selected = selectedProducts.some((p) => p.id === product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggleProduct(product)}
                        className={`border rounded-lg p-2 text-xs sm:text-sm text-left ${
                          selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="font-semibold text-gray-800">{product.name_en}</div>
                        {product.name_ta && (
                          <div className="text-gray-500 text-[10px]">{product.name_ta}</div>
                        )}
                        <div className="text-blue-600 font-semibold mt-1">
                          ₹{parseFloat(product.price).toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                  Dates
                </h2>
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={previousMonth}
                        className="text-base font-bold text-gray-600 hover:text-gray-800 px-2 py-1"
                      >
                        ‹
                      </button>
                      <span className="text-sm font-semibold text-gray-800">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <button
                        onClick={nextMonth}
                        className="text-base font-bold text-gray-600 hover:text-gray-800 px-2 py-1"
                      >
                        ›
                      </button>
                    </div>
                    <label className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectAllMonth}
                        onChange={handleToggleSelectAll}
                        className="w-3 h-3"
                      />
                      <span>Select all (no Sundays)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-[10px] sm:text-xs mb-2">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-gray-600 py-1"
                    >
                      {day}
                    </div>
                  ))}
                  {days.map((date, index) => {
                    if (!date) {
                      return (
                        <div key={`empty-${index}`} className="aspect-square text-xs" />
                      );
                    }

                    const dateStr = toLocalDateString(date);
                    const selected = isDateSelected(date);
                    const sunday = isSunday(date);

                    return (
                      <button
                        key={dateStr}
                        onClick={() => !sunday && toggleDate(date)}
                        disabled={sunday}
                        className={`aspect-square rounded text-[10px] sm:text-xs font-semibold transition-all ${
                          sunday
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-blue-100'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 text-xs text-gray-700">
                  Selected days: <span className="font-semibold">{selectedDates.length}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                  Payment Mode
                </h2>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment_mode"
                      value="CASH"
                      checked={paymentMode === 'CASH'}
                      onChange={() => setPaymentMode('CASH')}
                    />
                    <span>Cash</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment_mode"
                      value="FREE"
                      checked={paymentMode === 'FREE'}
                      onChange={() => setPaymentMode('FREE')}
                    />
                    <span>Free Meals</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment_mode"
                      value="GUEST"
                      checked={paymentMode === 'GUEST'}
                      onChange={() => setPaymentMode('GUEST')}
                    />
                    <span>Guest</span>
                  </label>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || submitting}
                  className="w-full mt-4 bg-blue-600 text-white text-sm sm:text-base px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing…' : 'Create & Print Bill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminCheckout;


