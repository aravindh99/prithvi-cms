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
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Powered by</span>
                <img src={xtownLogo} alt="XTOWN" className="h-6" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <a 
                  href="https://merchant.razorpay.com/policy/RnCjoGYkkfDPui/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Terms
                </a>
                <a 
                  href="https://merchant.razorpay.com/policy/RnCjoGYkkfDPui/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Privacy
                </a>
                <a 
                  href="https://merchant.razorpay.com/policy/RnCjoGYkkfDPui/refund" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Refund
                </a>
                <a 
                  href="http://merchant.razorpay.com/policy/RnCjoGYkkfDPui/shipping" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Shipping
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;

