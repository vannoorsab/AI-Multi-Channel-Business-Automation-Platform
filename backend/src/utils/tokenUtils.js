const jwt = require('jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'supersecretjwtsecretkeychangeinproduction';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforrotationsecurity';

// Generate short-lived access token containing ID and Role
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_ACCESS_SECRET, {
    expiresIn: '15m', // Short life
  });
};

// Generate long-lived refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: '30d', // Rotational lifespan
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
