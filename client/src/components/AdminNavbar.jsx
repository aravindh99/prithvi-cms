import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import prithviLogo from '../assets/prithvi_logo.png';
import {
  FaHome,
  FaBox,
  FaBuilding,
  FaFileAlt,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCashRegister
} from 'react-icons/fa';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
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

  const navBg = isDark ? 'bg-slate-900/70 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-800';
  const activeTab = isDark ? 'bg-amber-500/90 text-slate-950' : 'bg-blue-600 text-white';
  const inactiveTab = isDark ? 'text-slate-200 hover:bg-slate-800/80' : 'text-gray-700 hover:bg-gray-100';
  const divider = isDark ? 'border-slate-700' : 'border-gray-300';
  const logoutBtn = isDark
    ? 'bg-rose-500 text-white hover:bg-rose-600'
    : 'bg-red-600 text-white hover:bg-red-700';

  return (
    <nav className={`${navBg} backdrop-blur-lg shadow-md sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src={prithviLogo}
              alt="Prithvi"
              className="h-10 sm:h-12 rounded-full border border-white/10 shadow-lg"
              style={{ aspectRatio: '2.8 / 1', width: 'auto' }}
            />
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                    isActive ? activeTab : inactiveTab
                  }`}
                >
                  <Icon /> <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}

            <div className={`ml-4 pl-4 border-l ${divider} flex items-center gap-4`}>
              <span className="text-sm opacity-80 hidden xl:inline">Welcome, {user?.username}</span>
              <button onClick={handleLogout} className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${logoutBtn}`}>
                <FaSignOutAlt /> <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg ${isDark ? 'text-slate-100 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {mobileMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className={`lg:hidden border-t ${divider} py-4`}>
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive ? activeTab : inactiveTab
                    }`}
                  >
                    <Icon /> {item.label}
                  </button>
                );
              })}
              <div className={`pt-4 border-t ${divider} mt-4`}>
                <div className="px-4 py-2 text-sm opacity-80 mb-2">Welcome, {user?.username}</div>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${logoutBtn}`}
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

