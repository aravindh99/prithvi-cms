import { Link } from 'react-router-dom';
import xtownLogo from '../assets/Xtown-dark-logo.png';

const Layout = ({ children, showFooter = true }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1">
        {children}
      </main>
      {showFooter && (
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-600 text-sm">Powered by</span>
            <img src={xtownLogo} alt="XTOWN" className="h-6" />
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;

