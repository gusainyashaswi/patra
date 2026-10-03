const authService = require('../services/authService');

// Handles domain errors with HTTP status or delegates to global error handler
const handleAuthError = (err, res, next) =>
  err.status ? res.status(err.status).json({ success: false, message: err.message }) : next(err);

// Formats safe user profile for responses
const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// Handles user registration, creates account, and returns initial JWT
async function register(req, res, next) {
  try {
    const { user, token } = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: formatUser(user),
      token,
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
}

// Handles user login and returns signed JWT on valid credentials
async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: formatUser(user),
      token,
    });
  } catch (error) {
    handleAuthError(error, res, next);
  }
}

// Returns the profile of the currently authenticated user from req.user
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: formatUser(req.user),
  });
}

// Handles logout response for the client session
async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

module.exports = {
  register,
  login,
  getMe,
  logout,
};
