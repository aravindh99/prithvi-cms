import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Layout from '../../components/Layout.jsx';
import Loading from '../../components/Loading.jsx';
import prithviLogo from '../../assets/prithvi_logo.png';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Admin access required');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <img src={prithviLogo} alt="Prithvi" className="h-20 sm:h-24 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Prithvi CMS</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Admin Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base md:text-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-base sm:text-lg font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 sm:py-4 text-base sm:text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-gray-700 text-base sm:text-lg font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 sm:py-4 text-base sm:text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 sm:py-4 text-base sm:text-lg md:text-xl font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-200 text-gray-700 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to User Login
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLogin;

