import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { OrderProvider } from './context/OrderContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Kiosk routes
import KioskLogin from './pages/kiosk/Login.jsx';
import ProductSelection from './pages/kiosk/ProductSelection.jsx';
import CalendarSelection from './pages/kiosk/CalendarSelection.jsx';
import Payment from './pages/kiosk/Payment.jsx';
import Success from './pages/kiosk/Success.jsx';

// Admin routes
import AdminLogin from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Products from './pages/admin/Products.jsx';
import Units from './pages/admin/Units.jsx';
import Logs from './pages/admin/Logs.jsx';
import Users from './pages/admin/Users.jsx';
import AdminCheckout from './pages/admin/AdminCheckout.jsx';
import Terms from './pages/policies/Terms.jsx';
import Privacy from './pages/policies/Privacy.jsx';
import Refund from './pages/policies/Refund.jsx';
import Shipping from './pages/policies/Shipping.jsx';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Kiosk Routes */}
      <Route path="/login" element={<KioskLogin />} />
      <Route
        path="/kiosk/products"
        element={
          <ProtectedRoute>
            <OrderProvider>
              <ProductSelection />
            </OrderProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kiosk/calendar"
        element={
          <ProtectedRoute>
            <OrderProvider>
              <CalendarSelection />
            </OrderProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kiosk/payment"
        element={
          <ProtectedRoute>
            <OrderProvider>
              <Payment />
            </OrderProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kiosk/success"
        element={
          <ProtectedRoute>
            <OrderProvider>
              <Success />
            </OrderProvider>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Policy Pages */}
      <Route path="/policies/terms" element={<Terms />} />
      <Route path="/policies/privacy" element={<Privacy />} />
      <Route path="/policies/refund" element={<Refund />} />
      <Route path="/policies/shipping" element={<Shipping />} />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute requireAdmin>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/units"
        element={
          <ProtectedRoute requireAdmin>
            <Units />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute requireAdmin>
            <Logs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/checkout"
        element={
          <ProtectedRoute requireAdmin>
            <AdminCheckout />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          user ? (
            user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/kiosk/products" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    // Disable context menu (right-click menu) for kiosk mode
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
