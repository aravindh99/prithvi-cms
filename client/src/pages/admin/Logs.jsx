import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import AdminNavbar from '../../components/AdminNavbar.jsx';
import Loading from '../../components/Loading.jsx';
import { FaEye, FaPrint, FaTrash } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext.jsx';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  // Helper to format a JS Date as YYYY-MM-DD using local time (no UTC shift)
  const toLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Default date filter: current month start to 30 days in the future (to include scheduled bills)
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  
  const [filters, setFilters] = useState({
    start_date: toLocalDateString(new Date(new Date().setDate(1))),
    end_date: toLocalDateString(defaultEndDate),
    unit_id: '',
    payment_mode: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1
  });
  const { isDark } = useTheme();

  const fetchUnits = useCallback(async () => {
    try {
      const response = await api.get('/units');
      setUnits(response.data);
    } catch (error) {
      console.error('Fetch units error:', error);
    }
  }, []);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.unit_id && filters.unit_id.trim() !== '') params.append('unit_id', filters.unit_id);
      if (filters.payment_mode && filters.payment_mode.trim() !== '') params.append('payment_mode', filters.payment_mode);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      console.log('[Logs Frontend] Fetching bills with filters:', { 
        start_date: filters.start_date, 
        end_date: filters.end_date, 
        unit_id: filters.unit_id, 
        payment_mode: filters.payment_mode,
        page: filters.page,
        limit: filters.limit
      });
      console.log('[Logs Frontend] API URL:', `/logs?${params.toString()}`);

      const response = await api.get(`/logs?${params.toString()}`);
      console.log('[Logs Frontend] Response:', { 
        logsCount: response.data.logs?.length || 0, 
        total: response.data.total, 
        page: response.data.page,
        totalPages: response.data.totalPages 
      });
      
      setLogs(response.data.logs || []);
      const serverPage = response.data.page;
      setPagination({
        total: response.data.total,
        page: serverPage,
        totalPages: response.data.totalPages
      });
      // Sync filters.page with server response (in case server adjusted the page number)
      if (filters.page !== serverPage) {
        setFilters(prev => ({ ...prev, page: serverPage }));
      }
    } catch (error) {
      console.error('Fetch bills error:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleDeleteBill = async (billId) => {
    if (!confirm('Are you sure you want to delete this bill? This action cannot be undone.')) return;

    try {
      await api.delete(`/logs/${billId}`);
      alert('Bill deleted successfully!');
      fetchBills();
    } catch (error) {
      console.error('Delete bill error:', error);
      alert(error.response?.data?.error || 'Failed to delete bill. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    const count = pagination.total;
    if (count === 0) {
      alert('No bills to delete.');
      return;
    }

    const confirmMessage = `WARNING: You are about to delete ALL ${count} bill(s) matching the current filters.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to proceed?`;
    
    if (!confirm(confirmMessage)) return;

    // Double confirmation for safety
    const doubleConfirm = confirm(`FINAL WARNING: You are about to permanently delete ${count} bill(s).\n\nPress OK to confirm, or Cancel to abort.`);
    
    if (!doubleConfirm) return;

    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.unit_id) params.append('unit_id', filters.unit_id);
      if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);

      const response = await api.delete(`/logs/all?${params.toString()}`);
      alert(response.data.message || `Successfully deleted ${response.data.deletedCount} bill(s)!`);
      fetchBills();
    } catch (error) {
      console.error('Delete all bills error:', error);
      alert(error.response?.data?.error || 'Failed to delete bills. Please try again.');
    }
  };

  const handleViewBill = async (billId) => {
    try {
      const response = await api.get(`/logs/${billId}`);
      setSelectedBill(response.data);
    } catch (error) {
      console.error('Fetch bill details error:', error);
      alert('Failed to load bill details.');
    }
  };

  const handleRetryPrint = async (orderId, billId) => {
    if (!confirm('Retry printing this bill?')) return;

    try {
      await api.post(`/orders/${orderId}/bills/${billId}/print`);
      alert('Print command sent successfully!');
      fetchBills();
    } catch (error) {
      console.error('Retry print error:', error);
      alert(error.response?.data?.error || 'Print failed. Please check printer connection.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not printed';
    return new Date(dateString).toLocaleString('en-IN');
  };

  if (loading && logs.length === 0) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <AdminNavbar />
      <div className={`min-h-screen p-4 sm:p-6 md:p-8 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Order Logs</h1>
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
            >
              <FaTrash /> Delete All ({pagination.total})
            </button>
          </div>

          <div className={`rounded-2xl border p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8 ${isDark ? 'bg-slate-900/70 border-slate-800 shadow-black/30 shadow-lg' : 'bg-white border-gray-200 shadow-lg'}`}>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unit</label>
                <select
                  value={filters.unit_id}
                  onChange={(e) => setFilters({ ...filters, unit_id: e.target.value, page: 1 })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-gray-300'}`}
                >
                  <option value="">All Units</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Mode</label>
                <select
                  value={filters.payment_mode}
                  onChange={(e) => setFilters({ ...filters, payment_mode: e.target.value, page: 1 })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-gray-300'}`}
                >
                  <option value="">All Modes</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="FREE">Free Meals</option>
                  <option value="GUEST">Guest</option>
                </select>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900/70 border-slate-800 shadow-black/30 shadow-lg' : 'bg-white border-gray-200 shadow-lg'}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className={isDark ? 'bg-slate-800/80' : 'bg-gray-100'}>
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Bill Date</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Unit</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Amount</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Payment Mode</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Payment Status</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Printed At</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'divide-y divide-slate-800' : 'divide-y divide-gray-200'}>
                  {logs.map((log) => (
                    <tr key={`${log.id}-${log.item_id || 'noitem'}`} className={isDark ? 'hover:bg-slate-800/60' : 'hover:bg-gray-50'}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{formatDate(log.bill_date)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{log.unit?.name || 'N/A'}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">₹{parseFloat(log.line_total ?? log.amount ?? 0).toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.payment_mode === 'CASH' ? (isDark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-green-100 text-green-800') :
                          log.payment_mode === 'UPI' ? (isDark ? 'bg-blue-500/20 text-blue-200' : 'bg-blue-100 text-blue-800') :
                          log.payment_mode === 'FREE' ? (isDark ? 'bg-amber-500/20 text-amber-200' : 'bg-orange-100 text-orange-800') :
                          isDark ? 'bg-slate-700 text-slate-100' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {log.payment_mode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.payment_status === 'PAID'
                              ? isDark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-green-100 text-green-800'
                              : log.payment_status === 'PENDING'
                              ? isDark ? 'bg-amber-500/20 text-amber-200' : 'bg-yellow-100 text-yellow-800'
                              : log.payment_status
                              ? isDark ? 'bg-rose-500/20 text-rose-200' : 'bg-red-100 text-red-800'
                              : isDark ? 'bg-slate-700 text-slate-100' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.payment_status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        {log.is_printed ? (
                          <span className="text-emerald-400">{formatDateTime(log.printed_at)}</span>
                        ) : (
                          <span className="text-rose-400">Not printed</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="flex gap-1 sm:gap-2">
                          <button
                            onClick={() => handleViewBill(log.id)}
                            className={`px-2 sm:px-3 py-1 rounded flex items-center gap-1 text-xs sm:text-sm ${
                              isDark ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            <FaEye /> <span className="hidden sm:inline">View</span>
                          </button>
                          {!log.is_printed && log.payment_mode !== 'GUEST' && (
                            <button
                              onClick={() => handleRetryPrint(log.order_id, log.id)}
                              className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1 text-xs sm:text-sm"
                            >
                              <FaPrint /> <span className="hidden sm:inline">Print</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBill(log.id)}
                            className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-red-600 flex items-center gap-1 text-xs sm:text-sm"
                          >
                            <FaTrash /> <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className={`px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 ${isDark ? 'bg-slate-800/60' : 'bg-gray-50'}`}>
                <div className="text-xs sm:text-sm">
                  Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(1, pagination.page - 1) })}
                    disabled={pagination.page <= 1}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark ? 'bg-slate-900 border border-slate-700 hover:bg-slate-800' : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                    disabled={pagination.page >= pagination.totalPages}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark ? 'bg-slate-900 border border-slate-700 hover:bg-slate-800' : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedBill && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-3xl w-full my-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Bill Details</h2>
                  <button
                    onClick={() => setSelectedBill(null)}
                    className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="font-semibold">Bill Date:</span> {formatDate(selectedBill.bill_date)}
                  </div>
                  <div>
                    <span className="font-semibold">Unit:</span> {selectedBill.order?.unit?.name}
                  </div>
                  <div>
                    <span className="font-semibold">Order ID:</span> {selectedBill.order?.id}
                  </div>
                  <div>
                    <span className="font-semibold">Payment Mode:</span> {selectedBill.order?.payment_mode}
                  </div>
                  <div>
                    <span className="font-semibold">Payment Status:</span> {selectedBill.order?.payment_status}
                  </div>
                  <div>
                    <span className="font-semibold">Amount:</span> ₹{parseFloat(selectedBill.amount).toFixed(2)}
                  </div>
                  <div>
                    <span className="font-semibold">Printed:</span> {selectedBill.is_printed ? formatDateTime(selectedBill.printed_at) : 'Not printed'}
                  </div>
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-2">Items:</h3>
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-left">Quantity</th>
                          <th className="px-4 py-2 text-left">Price</th>
                          <th className="px-4 py-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">{item.product?.name_en} | {item.product?.name_ta}</td>
                            <td className="px-4 py-2">{item.quantity}</td>
                            <td className="px-4 py-2">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                            <td className="px-4 py-2">₹{parseFloat(item.total_price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Logs;

