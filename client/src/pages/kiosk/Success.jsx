import { useNavigate, useLocation } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import Layout from '../../components/Layout.jsx';
import successGif from '../../assets/success.gif';

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetOrder } = useOrder();
  const { order, printResults, printWarning } = location.state || {};

  const handleReturn = () => {
    resetOrder();
    navigate('/kiosk/products');
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 md:p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-2xl w-full text-center">
          <img src={successGif} alt="Success" className="h-24 sm:h-32 mx-auto mb-4 sm:mb-6" />
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${printWarning ? 'text-yellow-600' : 'text-green-600'}`}>
            {printWarning ? 'Payment Successful!' : 'Order Successful!'}
          </h1>
          
          {printWarning && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-base sm:text-lg font-semibold text-yellow-800">
                ⚠️ Payment was successful, but printing failed for some bills.
              </p>
              <p className="text-sm sm:text-base text-yellow-700 mt-2">
                The order has been saved. Admin can retry printing from the logs page.
              </p>
            </div>
          )}
          
          {order && (
            <div className="mb-4 sm:mb-6">
              <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-2">Order ID: {order.id}</p>
              <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-2">Total Amount: ₹{parseFloat(order.total_amount).toFixed(2)}</p>
              <p className="text-base sm:text-lg md:text-xl text-gray-700">Payment Mode: {order.payment_mode}</p>
            </div>
          )}

          {printResults && (
            <div className="mb-4 sm:mb-6">
              <p className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Print Status:</p>
              {printResults.map((result, index) => (
                <p key={index} className={`text-sm sm:text-base md:text-lg ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  Bill {result.billId}: {result.success ? 'Printed' : `Failed - ${result.error}`}
                </p>
              ))}
              {printResults.some(r => !r.success) && (
                <p className="text-sm sm:text-base text-yellow-600 mt-2 font-semibold">
                  Note: Some bills failed to print. Please contact support.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleReturn}
            className="w-full sm:w-auto bg-blue-600 text-white px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Start
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Success;

