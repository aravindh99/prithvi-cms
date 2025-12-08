import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import AdminNavbar from '../../components/AdminNavbar.jsx';
import Loading from '../../components/Loading.jsx';
import { FaEdit, FaTrash, FaPlus, FaPrint } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext.jsx';

const Units = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    printer_ip: '',
    printer_port: 9100,
    is_active: true
  });
  const [testPrintLoading, setTestPrintLoading] = useState(null);
  const { isDark } = useTheme();

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/units');
      setUnits(response.data);
    } catch (error) {
      console.error('Fetch units error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleOpenModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        code: unit.code,
        printer_ip: unit.printer_ip,
        printer_port: unit.printer_port,
        is_active: unit.is_active
      });
    } else {
      setEditingUnit(null);
      setFormData({
        name: '',
        code: '',
        printer_ip: '',
        printer_port: 9100,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    setFormData({
      name: '',
      code: '',
      printer_ip: '',
      printer_port: 9100,
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        await api.put(`/units/${editingUnit.id}`, formData);
      } else {
        await api.post('/units', formData);
      }
      handleCloseModal();
      fetchUnits();
    } catch (error) {
      console.error('Save unit error:', error);
      alert('Failed to save unit. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      await api.delete(`/units/${id}`);
      fetchUnits();
    } catch (error) {
      console.error('Delete unit error:', error);
      alert(error.response?.data?.error || 'Failed to delete unit. Please try again.');
    }
  };

  const handleTestPrint = async (unitId) => {
    try {
      setTestPrintLoading(unitId);
      const response = await api.post(`/units/${unitId}/test-print`);
      alert('Test print successful!');
    } catch (error) {
      console.error('Test print error:', error);
      alert(error.response?.data?.error || 'Test print failed. Please check printer connection.');
    } finally {
      setTestPrintLoading(null);
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
      <div className={`min-h-screen p-4 sm:p-6 md:p-8 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Units</h1>
            <button
              onClick={() => handleOpenModal()}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-semibold rounded-lg flex items-center justify-center gap-2 ${
                isDark ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-emerald-500/30 shadow-lg' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FaPlus /> Add Unit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {units.map((unit) => (
              <div
                key={unit.id}
                className={`rounded-xl p-4 sm:p-6 border ${
                  isDark ? 'bg-slate-900/70 border-slate-800 shadow-black/30 shadow-lg' : 'bg-white border-gray-200 shadow-lg'
                }`}
              >
                <div className="text-xl sm:text-2xl font-bold mb-2">{unit.name}</div>
                <div className={`text-sm sm:text-base mb-3 sm:mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Code: {unit.code}</div>
                <div className="space-y-2 mb-4 text-sm">
                  <div>
                    <span className="font-semibold">Printer IP:</span> {unit.printer_ip}
                  </div>
                  <div>
                    <span className="font-semibold">Printer Port:</span> {unit.printer_port}
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={unit.is_active ? 'text-emerald-400' : 'text-rose-400'}>
                      {unit.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => handleOpenModal(unit)}
                    className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                      isDark ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <FaEdit /> <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleTestPrint(unit.id)}
                    disabled={testPrintLoading === unit.id}
                    className="bg-green-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center"
                  >
                    {testPrintLoading === unit.id ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FaPrint />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id)}
                    className="bg-red-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div
                className={`rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full my-4 border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-white'
                }`}
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                  {editingUnit ? 'Edit Unit' : 'Add Unit'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'border-gray-300'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Printer IP</label>
                    <input
                      type="text"
                      value={formData.printer_ip}
                      onChange={(e) => setFormData({ ...formData, printer_ip: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Printer Port</label>
                    <input
                      type="number"
                      value={formData.printer_port}
                      onChange={(e) => setFormData({ ...formData, printer_port: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
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
                      {editingUnit ? 'Update' : 'Create'}
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

export default Units;

