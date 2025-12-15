import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import Layout from '../../components/Layout.jsx';
import successGif from '../../assets/success.gif';
import { useTheme } from '../../context/ThemeContext.jsx';

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetOrder } = useOrder();
  const { order, printResults, printWarning } = location.state || {};
  const { isDark } = useTheme();
  const [countDown, setCountDown] = useState(3);

  const handleReturn = () => {
    resetOrder();
    navigate('/kiosk/products');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountDown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleReturn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Layout>
      <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-2xl w-full text-center border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white'}`}>
          <img src={successGif} alt="Success" className="h-24 sm:h-32 mx-auto mb-4 sm:mb-6" />
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${printWarning ? 'text-yellow-400' : 'text-emerald-300'}`}>
            {printWarning ? 'Payment Successful!' : 'Order Successful!'}
          </h1>

          {printWarning && (
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg ${isDark ? 'bg-amber-500/10 border border-amber-400/40 text-amber-200' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
              <p className="text-base sm:text-lg font-semibold">
                ⚠️ Payment was successful, but printing failed for some bills.
              </p>
              <p className={`text-sm sm:text-base mt-2 ${isDark ? 'text-amber-100' : 'text-yellow-700'}`}>
                The order has been saved. Admin can retry printing from the logs page.
              </p>
            </div>
          )}

          {order && (
            <div className="mb-4 sm:mb-6">
              <p className="text-base sm:text-lg md:text-xl mb-2">Order ID: {order.id}</p>
              <p className="text-base sm:text-lg md:text-xl mb-2">Total Amount: ₹{parseFloat(order.total_amount).toFixed(2)}</p>
              <p className="text-base sm:text-lg md:text-xl">Payment Mode: {order.payment_mode}</p>
            </div>
          )}

          {printResults && (
            <div className="mb-4 sm:mb-6">
              <p className="text-base sm:text-lg font-semibold mb-2">Print Status:</p>
              {printResults.map((result, index) => (
                <p key={index} className={`text-sm sm:text-base md:text-lg ${result.success ? 'text-emerald-300' : 'text-rose-400'}`}>
                  Bill {result.billId}: {result.success ? 'Printed' : `Failed - ${result.error}`}
                </p>
              ))}
              {printResults.some(r => !r.success) && (
                <p className={`text-sm sm:text-base mt-2 font-semibold ${isDark ? 'text-amber-200' : 'text-yellow-600'}`}>
                  Note: Some bills failed to print. Please contact support.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleReturn}
            className={`w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-semibold rounded-lg transition-colors ${isDark ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            Return to Start ({countDown}s)
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Success;

