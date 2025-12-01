import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FaHome, FaBox, FaBuilding, FaFileAlt, FaUsers, FaSignOutAlt, FaBars, FaTimes, FaCashRegister } from 'react-icons/fa';
import api from '../config/api.js';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/admin/checkout', icon: FaCashRegister, label: 'Checkout' },
    { path: '/admin/products', icon: FaBox, label: 'Products' },
    { path: '/admin/units', icon: FaBuilding, label: 'Units' },
    { path: '/admin/logs', icon: FaFileAlt, label: 'Logs' },
    { path: '/admin/users', icon: FaUsers, label: 'Users' }
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.svg" alt="Prithvi" className="h-8 w-8 sm:h-10 sm:w-10" />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Prithvi CMS</h1>
              <span className="text-xs text-gray-500 hidden sm:inline">Admin Panel</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon /> <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}
            
            <div className="ml-4 pl-4 border-l border-gray-300 flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden xl:inline">Welcome, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
              >
                <FaSignOutAlt /> <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon /> {item.label}
                  </button>
                );
              })}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="px-4 py-2 text-sm text-gray-600 mb-2">
                  Welcome, {user?.username}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;

