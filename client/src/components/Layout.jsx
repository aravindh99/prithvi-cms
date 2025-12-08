import { Link } from 'react-router-dom';
import xtownLogo from '../assets/Xtown-dark-logo.png';
import ThemeToggle from './ThemeToggle.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const Layout = ({ children, showFooter = true, showThemeToggle = true }) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <main className="flex-1">{children}</main>

      {showFooter && (
        <footer
          className={`border-t py-4 px-6 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-3 pt-2">
              <div className="flex  gap-2 mt-2 ">
                <p className={isDark ? 'text-slate-300 text-sm -mt-1' : 'text-gray-600 text-sm -mt-1'}>
                  Powered by
                </p>
                <img src={xtownLogo} alt="XTOWN" className="h-6" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm mt-1">
                {[
                  { to: '/policies/terms', label: 'Terms' },
                  { to: '/policies/privacy', label: 'Privacy' },
                  { to: '/policies/refund', label: 'Refund' },
                  { to: '/policies/shipping', label: 'Shipping' }
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`transition-colors ${
                      isDark
                        ? 'text-amber-200 hover:text-white'
                        : 'text-blue-600 hover:text-blue-800'
                    } hover:underline`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </footer>
      )}

      {showThemeToggle && <ThemeToggle />}
    </div>
  );
};

export default Layout;

