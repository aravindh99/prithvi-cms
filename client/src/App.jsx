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
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
