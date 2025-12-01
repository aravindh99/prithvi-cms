import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import AdminNavbar from '../../components/AdminNavbar.jsx';
import Loading from '../../components/Loading.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBills: 0,
    totalRevenue: 0,
    cashCount: 0,
    upiCount: 0,
    freeCount: 0,
    guestCount: 0
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const toLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [filters, setFilters] = useState({
    start_date: toLocalDateString(new Date(new Date().setDate(1))),
    end_date: toLocalDateString(new Date()),
    unit_id: '',
    payment_mode: ''
  });
  const [units, setUnits] = useState([]);

  const fetchUnits = useCallback(async () => {
    try {
      const response = await api.get('/units');
      setUnits(response.data);
    } catch (error) {
      console.error('Fetch units error:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.unit_id) params.append('unit_id', filters.unit_id);
      if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);

      const response = await api.get(`/dashboard/summary?${params.toString()}`);
      const { modes, overall, products: productSummary, billsCount } = response.data;

      setStats({
        totalBills: billsCount,
        totalRevenue: overall.total,
        cashCount: modes.CASH?.count || 0,
        upiCount: modes.UPI?.count || 0,
        freeCount: modes.FREE?.count || 0,
        guestCount: modes.GUEST?.count || 0
      });
      setProducts(productSummary || []);
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportPdf = async () => {
    try {
      const element = document.getElementById('dashboard-print-area');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, Math.min(imgHeight, pageHeight - 10));
      pdf.save('dashboard-summary.pdf');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Dashboard</h1>
            <button
              onClick={handleExportPdf}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 text-sm sm:text-base font-medium"
            >
              Export PDF
            </button>
          </div>

          <div id="dashboard-print-area">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Filters</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Unit</label>
                  <select
                    value={filters.unit_id}
                    onChange={(e) => setFilters({ ...filters, unit_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Units</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Payment Mode</label>
                  <select
                    value={filters.payment_mode}
                    onChange={(e) => setFilters({ ...filters, payment_mode: e.target.value })}
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Total Bills</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  {stats.totalBills}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Total Revenue</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">
                  ₹{stats.totalRevenue.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Cash</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                  {stats.cashCount}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">UPI</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">
                  {stats.upiCount}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Free Meals</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">
                  {stats.freeCount}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Guest</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-600">
                  {stats.guestCount}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                Product Summary
              </h2>
              {products.length === 0 ? (
                <p className="text-sm text-gray-500">No data for selected filters.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto text-xs sm:text-sm">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Product</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((p) => (
                        <tr key={p.product_id}>
                          <td className="px-3 py-1">
                            <div className="font-semibold text-gray-800">{p.name_en}</div>
                            {p.name_ta && (
                              <div className="text-gray-500 text-xs">{p.name_ta}</div>
                            )}
                          </td>
                          <td className="px-3 py-1 text-right font-semibold text-gray-800">
                            {p.totalQty}
                          </td>
                          <td className="px-3 py-1 text-right font-semibold text-gray-800">
                            ₹{p.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

