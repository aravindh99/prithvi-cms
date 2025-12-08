import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import api from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import AdminNavbar from '../../components/AdminNavbar.jsx';
import Loading from '../../components/Loading.jsx';
import jsPDF from 'jspdf';

const Dashboard = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    totalBills: 0,
    totalRevenue: 0,
    cashCount: 0,
    upiCount: 0,
    freeCount: 0,
    guestCount: 0
  });
  const [products, setProducts] = useState([]);
  const [dailySeries, setDailySeries] = useState([]);
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
      const { modes, overall, products: productSummary, billsCount, dailySeries: series = [] } = response.data;

      setStats({
        totalBills: billsCount,
        totalRevenue: overall.total,
        cashCount: modes.CASH?.count || 0,
        upiCount: modes.UPI?.count || 0,
        freeCount: modes.FREE?.count || 0,
        guestCount: modes.GUEST?.count || 0
      });
      setProducts(productSummary || []);
      setDailySeries(series || []);
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

  const handleExportPdf = () => {
    try {
      if (!products || products.length === 0) {
        alert('No product data to export for the selected filters.');
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const leftMargin = 10;
      let y = 10;

      // Title
      pdf.setFontSize(16);
      pdf.text('Prithvi - Product Summary', leftMargin, y);
      y += 8;

      // Filter info
      pdf.setFontSize(10);
      pdf.text(`From: ${filters.start_date}  To: ${filters.end_date}`, leftMargin, y);
      y += 5;

      if (filters.unit_id) {
        const unit = units.find((u) => String(u.id) === String(filters.unit_id));
        if (unit) {
          pdf.text(`Unit: ${unit.name}`, leftMargin, y);
          y += 5;
        }
      }

      if (filters.payment_mode) {
        pdf.text(`Payment Mode: ${filters.payment_mode}`, leftMargin, y);
        y += 5;
      }

      y += 5;

      // Table header
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('Product', leftMargin, y);
      pdf.text('Qty', leftMargin + 90, y, { align: 'right' });
      pdf.text('Amount', leftMargin + 120, y, { align: 'right' });
      y += 4;
      pdf.line(leftMargin, y, pageWidth - leftMargin, y);
      y += 4;
      pdf.setFont(undefined, 'normal');

      // Rows
      products.forEach((p) => {
        const name = p.name_en || '';
        const qty = String(p.totalQty ?? 0);
        const amount = `Rs ${(p.totalAmount ?? 0).toFixed(2)}`;

        // Simple line wrap for long product names
        const maxNameWidth = 80;
        const lines = pdf.splitTextToSize(name, maxNameWidth);

        lines.forEach((line, idx) => {
          if (y > 280) {
            pdf.addPage();
            y = 10;
          }
          if (idx === 0) {
            pdf.text(line, leftMargin, y);
            pdf.text(qty, leftMargin + 90, y, { align: 'right' });
            pdf.text(amount, leftMargin + 120, y, { align: 'right' });
          } else {
            pdf.text(line, leftMargin, y);
          }
          y += 5;
        });
      });

      pdf.save(`product-summary-${filters.start_date}-to-${filters.end_date}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const donutData = useMemo(() => {
    const total = products.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const items = [...products]
      .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
      .slice(0, 4);
    const topSum = items.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    if (total - topSum > 0) {
      items.push({ name_en: 'Other', totalAmount: total - topSum });
    }
    const palette = ['#f97316', '#22d3ee', '#a855f7', '#38bdf8', '#fcd34d'];
    return {
      total,
      items: items.map((p, idx) => ({
        label: p.name_en || 'Product',
        value: p.totalAmount || 0,
        color: palette[idx % palette.length]
      }))
    };
  }, [products]);

  const lineData = useMemo(() => {
    if (!dailySeries || !dailySeries.length) return [];
    return dailySeries.map((d) => ({
      label: d.date,
      value: d.amount || 0,
      count: d.count || 0
    }));
  }, [dailySeries]);

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  const Card = ({ children }) => (
    <div
      className={`rounded-2xl border p-4 sm:p-6 ${
        isDark ? 'bg-slate-900/70 border-slate-800 shadow-lg shadow-black/30' : 'bg-white border-gray-200 shadow-lg'
      }`}
    >
      {children}
    </div>
  );

  const MiniLineChart = ({ data }) => {
    if (!data || data.length === 0) {
      return <div className="text-sm text-slate-400">No data for selected range.</div>;
    }
    const width = 480;
    const height = 200;
    const padding = 24;
    const maxY = Math.max(...data.map((d) => d.value), 1);
    const minY = 0;
    const step = Math.max(1, Math.ceil(data.length / 10)); // reduce label crowding

    const points = data
      .map((d, idx) => {
        const x = padding + (idx / Math.max(data.length - 1, 1)) * (width - padding * 2);
        const y = height - padding - ((d.value - minY) / (maxY - minY)) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d={`M${padding},${height - padding} L${points} L${width - padding},${height - padding} Z`}
          fill="url(#lineGradient)"
          opacity="0.5"
        />
        <polyline
          fill="none"
          stroke="#fbbf24"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {data.map((d, idx) => {
          const x = padding + (idx / Math.max(data.length - 1, 1)) * (width - padding * 2);
          const y = height - padding - ((d.value - minY) / (maxY - minY)) * (height - padding * 2);
          const dayNum = new Date(d.label).getDate();
          const showLabel = idx % step === 0 || idx === data.length - 1 || idx === 0;
          return (
            <g key={d.label}>
              <circle cx={x} cy={y} r="4" fill="#f97316" />
              {showLabel && (
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[9px]"
                  fill={isDark ? '#cbd5e1' : '#1e293b'}
                >
                  {dayNum}
                </text>
              )}
            </g>
          );
        })}
        {/* Month labels on extremes */}
        {data.length > 0 && (
          <>
            <text
              x={padding -20}
              y={height - 6}
              textAnchor="start"
              className="text-[9px]"
              fill={isDark ? '#cbd5e1' : '#1e293b'}
            >
              {new Date(data[0].label).toLocaleDateString(undefined, { month: 'short' })}
            </text>
            <text
              x={width - padding + 20}
              y={height - 6}
              textAnchor="end"
              className="text-[9px]"
              fill={isDark ? '#cbd5e1' : '#1e293b'}
            >
              {new Date(data[data.length - 1].label).toLocaleDateString(undefined, { month: 'short' })}
            </text>
          </>
        )}
        <text
          x={padding}
          y={padding - 8}
          className="text-xs font-semibold"
          fill={isDark ? '#cbd5e1' : '#0f172a'}
        >
          Revenue trend (selected range)
        </text>
      </svg>
    );
  };

  const DonutChart = ({ data }) => {
    if (!data || !data.items.length || !data.total) {
      return <div className="text-sm text-slate-400">No product mix for this range.</div>;
    }
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
      <div className="flex items-center gap-4 sm:gap-6">
        <svg viewBox="0 0 42 42" className="w-36 h-36 -rotate-90">
          {data.items.map((item) => {
            const value = item.value || 0;
            const pct = (value / data.total) * 100;
            const dash = (pct / 100) * circumference;
            const circle = (
              <circle
                key={item.label}
                cx="21"
                cy="21"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth="8"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="space-y-2">
          {data.items.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm sm:text-base">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-200">{item.label}</span>
              <span className="text-slate-400">₹{(item.value || 0).toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <AdminNavbar />
      <div className={`min-h-screen p-4 sm:p-6 md:p-8 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Overview</p>
              <h1 className="text-3xl sm:text-4xl font-bold">Dashboard</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportPdf}
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg shadow-amber-500/30 font-medium hover:translate-y-[-1px] transition-all"
              >
                Export PDF
              </button>
            </div>
          </div>

          <div id="dashboard-print-area" className="space-y-6 sm:space-y-8">
            <Card>
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Filters</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Start Date</label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">End Date</label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Unit</label>
                  <select
                    value={filters.unit_id}
                    onChange={(e) => setFilters({ ...filters, unit_id: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">All Units</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Payment Mode</label>
                  <select
                    value={filters.payment_mode}
                    onChange={(e) => setFilters({ ...filters, payment_mode: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">All Modes</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="FREE">Free Meals</option>
                    <option value="GUEST">Guest</option>
                  </select>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: 'Total Bills', value: stats.totalBills, color: 'text-amber-300' },
                { label: 'Total Revenue', value: `₹${stats.totalRevenue.toFixed(2)}`, color: 'text-emerald-300' },
                { label: 'Cash', value: stats.cashCount, color: 'text-sky-300' },
                { label: 'UPI', value: stats.upiCount, color: 'text-indigo-300' },
                { label: 'Free', value: stats.freeCount, color: 'text-slate-200' },
                { label: 'Guest', value: stats.guestCount, color: 'text-slate-200' }
              ].map((item) => (
                <Card key={item.label}>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                  <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${item.color}`}>{item.value}</div>
                </Card>
              ))}
            </div>

            <Card>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">Daily revenue trend</h2>
                    <span className="text-xs text-slate-400">
                      Range: {filters.start_date} → {filters.end_date}
                    </span>
                  </div>
                  <MiniLineChart data={lineData} />
                </div>
                <div className="w-full lg:w-80">
                  <h2 className="text-xl font-semibold mb-4">Product mix</h2>
                  <DonutChart data={donutData} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-400">Products</p>
                  <h2 className="text-xl sm:text-2xl font-bold">Top Products</h2>
                </div>
                <button
                  onClick={handleExportPdf}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-4 py-2 rounded-xl shadow-lg shadow-amber-500/30 text-sm font-medium hover:translate-y-[-1px] transition-all"
                >
                  Download PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700 text-sm">
                  <thead className={isDark ? 'bg-slate-800/60' : 'bg-gray-50'}>
                    <tr>
                      <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'divide-y divide-slate-800' : 'divide-y divide-gray-200'}>
                    {products.map((product) => (
                      <tr key={product.product_id}>
                        <td className="px-4 py-3 whitespace-nowrap">{product.name_en}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-300">{product.totalQty}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                          ₹{product.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

