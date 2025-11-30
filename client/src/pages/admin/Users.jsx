import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api.js';
import Layout from '../../components/Layout.jsx';
import AdminNavbar from '../../components/AdminNavbar.jsx';
import Loading from '../../components/Loading.jsx';
import { FaEdit, FaTrash, FaPlus, FaUserShield, FaUser } from 'react-icons/fa';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    unit_id: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Fetch users error:', error);
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
    fetchUsers();
    fetchUnits();
  }, [fetchUsers, fetchUnits]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '', // Don't show password
        role: user.role,
        unit_id: user.unit_id || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'user',
        unit_id: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'user'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Only send fields that are provided
        const updateData = {
          username: formData.username,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        if (formData.role === 'user') {
          updateData.unit_id = formData.unit_id;
        }
        await api.put(`/users/${editingUser.id}`, updateData);
      } else {
        if (!formData.password) {
          alert('Password is required for new users');
          return;
        }
        if (formData.role === 'user' && !formData.unit_id) {
          alert('Unit assignment is required for user role');
          return;
        }
        await api.post('/users', formData);
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Save user error:', error);
      alert(error.response?.data?.error || 'Failed to save user. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      alert(error.response?.data?.error || 'Failed to delete user. Please try again.');
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Users</h1>
            <button
              onClick={() => handleOpenModal()}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <FaPlus /> Add User
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Username</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Unit</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{user.username}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-fit ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? <FaUserShield /> : <FaUser />}
                        <span className="hidden sm:inline">{user.role === 'admin' ? 'Admin' : 'User'}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                      {user.unit ? `${user.unit.name} (${user.unit.code})` : user.role === 'admin' ? 'N/A' : 'Not assigned'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-blue-600 flex items-center gap-1 text-xs sm:text-sm"
                        >
                          <FaEdit /> <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
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

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full my-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingUser ? 'Edit User' : 'Add User'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Password {editingUser && '(leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required={!editingUser}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData({ 
                          ...formData, 
                          role: newRole,
                          unit_id: newRole === 'admin' ? '' : formData.unit_id
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {formData.role === 'user' && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Unit <span className="text-red-500">*</span></label>
                      <select
                        value={formData.unit_id}
                        onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="">Select Unit</option>
                        {units.map(unit => (
                          <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      {editingUser ? 'Update' : 'Create'}
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

export default Users;

