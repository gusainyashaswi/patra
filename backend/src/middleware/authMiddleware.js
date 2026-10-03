const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');

// Validates Bearer JWT, verifies database user, and attaches user to req.user
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Authorization header with Bearer token missing.',
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await userRepository.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

// Populates req.user if a valid Bearer token is provided, otherwise allows anonymous access
async function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;
    const decoded = token ? verifyToken(token) : null;
    req.user = decoded ? (await userRepository.findById(decoded.sub)) || null : null;
  } catch {
    req.user = null;
  }
  next();
}

module.exports = {
  authenticate,
  optionalAuth,
};
