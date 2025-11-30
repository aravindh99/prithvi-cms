// Trust user info from request headers (from localStorage)
// WARNING: This skips server-side validation - only use for development/testing
export const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Attach user info to request for use in routes
  req.userId = parseInt(userId);
  req.userRole = userRole;
  next();
};

export const requireAdmin = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  // Attach user info to request for use in routes
  req.userId = parseInt(userId);
  req.userRole = userRole;
  next();
};

