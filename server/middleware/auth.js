import jwt from 'jsonwebtoken';

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
};

export const requireAuth = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'change_this_secret';
    // console.log('Verifying token:', token.substring(0, 10) + '...');
    const payload = jwt.verify(token, secret);

    req.userId = payload.id;
    req.userRole = payload.role;
    req.userUnitId = payload.unit_id;

    next();
  } catch (error) {
    console.error('JWT verification failed.');
    console.error('Token:', token);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token', details: error.message });
  }
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    next();
  });
};

