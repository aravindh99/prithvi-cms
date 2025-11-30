import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from './Loading.jsx';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    const isAdminRoute = requireAdmin || window.location.pathname.startsWith('/admin');
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

