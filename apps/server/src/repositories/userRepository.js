const { prisma } = require('../database');

class UserRepository {
  // Inserts a new user record and returns the safe user profile without passwordHash
  async create({ name, email, passwordHash, role = 'user' }) {
    const isPlatformAdmin = role === 'admin';
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        isPlatformAdmin,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isPlatformAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...user,
      role: user.isPlatformAdmin ? 'admin' : 'user',
    };
  }

  // Finds a user by email, returning the passwordHash for credential validation
  async findByEmail(email) {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      password_hash: user.passwordHash,
      role: user.isPlatformAdmin ? 'admin' : 'user',
    };
  }

  // Finds a user by ID without exposing the passwordHash
  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isPlatformAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      role: user.isPlatformAdmin ? 'admin' : 'user',
    };
  }

  // Returns the total count of registered users
  async count() {
    return prisma.user.count();
  }
}

module.exports = new UserRepository();
