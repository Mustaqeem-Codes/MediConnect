// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Protect routes - verify token and attach user to request
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authorized to access this route' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      return next();
    }

    if (decoded.role === 'patient') {
      const result = await pool.query('SELECT is_blocked FROM patients WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      if (result.rows[0].is_blocked) {
        return res.status(403).json({ success: false, error: 'Your account is blocked' });
      }
    }

    if (decoded.role === 'doctor') {
      const result = await pool.query('SELECT is_blocked FROM doctors WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      if (result.rows[0].is_blocked) {
        return res.status(403).json({ success: false, error: 'Your account is blocked' });
      }
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authorized' 
    });
  }
};

// Role-based authorization middleware (optional, for later use)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized for this role' 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };