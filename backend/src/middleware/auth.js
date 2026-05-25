const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokenUtils');

// Protect routes - JWT verification middleware
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify the access token
      const decoded = verifyAccessToken(token);

      // Get user from database, exclude password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User session not found' });
      }

      next();
    } catch (error) {
      console.error('Access token verification failed:', error.message);
      
      // Send token expired error distinctly so client can trigger /refresh-token
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Access token expired', code: 'TOKEN_EXPIRED' });
      }
      
      return res.status(401).json({ success: false, error: 'Session invalid or token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no session token provided' });
  }
};

// Role-Based Access Control (RBAC) middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Admins have universal clearance
    if (req.user.role === 'admin') {
      return next();
    }

    const hasAccess = roles.includes(req.user.role);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role "${req.user.role}" does not have privileges for this action.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
