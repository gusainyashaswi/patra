const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { generateToken } = require('../utils/jwt');

const BCRYPT_SALT_ROUNDS = 12;

// Strips sensitive fields (passwords, hashes) from the user object
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, password, ...safeUser } = user;
  return safeUser;
}

// Normalizes email by trimming whitespace and converting to lowercase
function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

// Validates email address format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper to build errors with HTTP status codes
function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

class AuthService {
  // Registers a new user with a hashed password and generates a JWT access token
  async register({ name, email, password }) {
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) throw createError('Full name is required');
    if (trimmedName.length > 100) throw createError('Name must be 100 characters or fewer');

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      throw createError('A valid email address is required');
    }

    if (!password || typeof password !== 'string') {
      throw createError('Password is required');
    }
    if (password.length < 8) {
      throw createError('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      throw createError('Password must not exceed 128 characters');
    }

    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw createError('An account with this email address already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const newUser = await userRepository.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    });

    return {
      user: sanitizeUser(newUser),
      token: generateToken(newUser),
    };
  }

  // Authenticates user credentials and issues a JWT token
  async login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      throw createError('Email and password are required', 400);
    }

    const user = await userRepository.findByEmail(normalizedEmail);
    const isValid = user && (await bcrypt.compare(password, user.password_hash));
    if (!isValid) {
      throw createError('Invalid email or password', 401);
    }

    return {
      user: sanitizeUser(user),
      token: generateToken(user),
    };
  }

  // Fetches a user profile by ID without sensitive fields
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw createError('User account not found', 404);
    return sanitizeUser(user);
  }
}

module.exports = new AuthService();
