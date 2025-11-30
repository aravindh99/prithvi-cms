import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import AdminNavbar from '../../components/AdminNavbar.jsx';
import Loading from '../../components/Loading.jsx';

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
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
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

      const response = await api.get(`/logs?${params.toString()}&limit=1000`);
      const bills = response.data.bills;

      const stats = {
        totalBills: bills.length,
        totalRevenue: bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0),
        cashCount: bills.filter(b => b.order.payment_mode === 'CASH').length,
        upiCount: bills.filter(b => b.order.payment_mode === 'UPI').length,
        freeCount: bills.filter(b => b.order.payment_mode === 'FREE').length,
        guestCount: bills.filter(b => b.order.payment_mode === 'GUEST').length
      };

      setStats(stats);
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-6 md:mb-8">Dashboard</h1>

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
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
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
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{stats.totalBills}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Total Revenue</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">₹{stats.totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Cash</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{stats.cashCount}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">UPI</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{stats.upiCount}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Free Meals</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">{stats.freeCount}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Guest</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-600">{stats.guestCount}</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

