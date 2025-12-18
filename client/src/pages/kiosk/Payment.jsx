import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import Loading from '../../components/Loading.jsx';

const Payment = () => {
  const navigate = useNavigate();

  // Payment is now triggered directly from the calendar step (no extra page or delay).
  // If this route is reached, send the user back to the calendar flow.
  useEffect(() => {
    navigate('/kiosk/calendar', { replace: true });
  }, [navigate]);

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Loading />
        </div>
      </div>
    </Layout>
  );
};

export default Payment;

