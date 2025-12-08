import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Layout from '../../components/Layout.jsx';
import Loading from '../../components/Loading.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import prithviLogo from '../../assets/prithvi_logo.png';
import { useTheme } from '../../context/ThemeContext.jsx';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        if (!result.user.unit_id) {
          setError('You are not assigned to a unit. Please contact administrator.');
        } else {
          navigate('/kiosk/products');
        }
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <Layout showFooter={false} showThemeToggle={false}>
      <div
        className={`min-h-screen flex items-center justify-center p-4 sm:p-6 ${
          isDark ? 'bg-slate-950' : 'bg-slate-100'
        }`}
      >
        <div className="relative w-full max-w-5xl shadow-2xl rounded-3xl overflow-hidden border border-white/10 bg-slate-900/60 backdrop-blur-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-indigo-500/10 to-blue-500/10 pointer-events-none" />
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <ThemeToggle variant="inline" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative h-56 md:h-full bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_30%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,205,124,0.2),transparent_25%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
              <div className="relative h-full flex flex-col justify-between p-6 sm:p-8">
                <div className="flex items-center gap-3 flex-col">
                  <img src={prithviLogo} alt="Prithvi" className="h-12 w-32 rounded-full shadow-lg" />
                  <div className="text-white">
                    <p className="text-lg font-semibold">Prithvi Canteen</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-amber-100/90">Fuel your break</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug text-white">
                    Be a Part of <br /> Something Beautiful
                  </h2>
                  <p className="text-slate-100/80 text-sm sm:text-base max-w-sm">
                    Fast ordering for your favorite brews.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`relative p-6 sm:p-8 md:p-10 ${
                isDark ? 'bg-slate-950/80 text-slate-100' : 'bg-white text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-400">Kiosk Access</p>
                  <h1 className="text-2xl sm:text-3xl font-bold">Login</h1>
                  <p className="text-sm text-slate-400 mt-1">Enter your credentials to continue</p>
                </div>
                <img src={prithviLogo} alt="Prithvi" className="h-12 w-32 sm:h-14 sm:w-34 " />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {error && (
                  <div className="border border-red-400/50 bg-red-500/10 text-red-100 px-4 py-3 rounded-xl text-sm shadow-inner">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 text-slate-50 placeholder:text-slate-500"
                    required
                    autoFocus
                    placeholder="Username"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 text-slate-50 placeholder:text-slate-500"
                    required
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/30 hover:translate-y-[-1px] transition-all disabled:opacity-60"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Secure kiosk mode</span>
                </div>
                <button
                  onClick={() => navigate('/admin/login')}
                  className="text-amber-300 hover:text-white font-medium transition-colors"
                >
                  Admin login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;

