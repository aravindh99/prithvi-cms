import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import AdminNavbar from '../../components/AdminNavbar.jsx';
import Loading from '../../components/Loading.jsx';
import { FaEye, FaPrint, FaTrash } from 'react-icons/fa';

const Logs = () => {
  const [bills, setBills] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  // Default date filter: current month start to 30 days in the future (to include scheduled bills)
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end_date: defaultEndDate.toISOString().split('T')[0],
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
        billsCount: response.data.bills?.length || 0, 
        total: response.data.total, 
        page: response.data.page,
        totalPages: response.data.totalPages 
      });
      
      setBills(response.data.bills);
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
    const doubleConfirm = confirm(`FINAL WARNING: You are about to permanently delete ${count} bill(s).\n\nType OK to confirm, or Cancel to abort.`);
    
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not printed';
    return new Date(dateString).toLocaleString('en-IN');
  };

  if (loading && bills.length === 0) {
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Order Logs</h1>
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
            >
              <FaTrash /> Delete All ({pagination.total})
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Unit</label>
                <select
                  value={filters.unit_id}
                  onChange={(e) => setFilters({ ...filters, unit_id: e.target.value, page: 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Units</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Payment Mode</label>
                <select
                  value={filters.payment_mode}
                  onChange={(e) => setFilters({ ...filters, payment_mode: e.target.value, page: 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Bill Date</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Unit</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Payment Mode</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Printed At</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{formatDate(bill.bill_date)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{bill.order?.unit?.name || 'N/A'}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">₹{parseFloat(bill.amount).toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          bill.order?.payment_mode === 'CASH' ? 'bg-green-100 text-green-800' :
                          bill.order?.payment_mode === 'UPI' ? 'bg-blue-100 text-blue-800' :
                          bill.order?.payment_mode === 'FREE' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bill.order?.payment_mode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {bill.is_printed ? (
                          <span className="text-green-600">{formatDateTime(bill.printed_at)}</span>
                        ) : (
                          <span className="text-red-600">Not printed</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="flex gap-1 sm:gap-2">
                          <button
                            onClick={() => handleViewBill(bill.id)}
                            className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-blue-600 flex items-center gap-1 text-xs sm:text-sm"
                          >
                            <FaEye /> <span className="hidden sm:inline">View</span>
                          </button>
                          {!bill.is_printed && bill.order?.payment_mode !== 'GUEST' && (
                            <button
                              onClick={() => handleRetryPrint(bill.order_id, bill.id)}
                              className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1 text-xs sm:text-sm"
                            >
                              <FaPrint /> <span className="hidden sm:inline">Print</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
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
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(1, pagination.page - 1) })}
                    disabled={pagination.page <= 1}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-gray-50"
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
                    <span className="font-semibold">Payment Mode:</span> {selectedBill.order?.payment_mode}
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

