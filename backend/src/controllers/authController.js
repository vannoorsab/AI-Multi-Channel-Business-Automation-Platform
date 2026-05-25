const User = require('../models/User');
const Business = require('../models/Business');
const Workspace = require('../models/Workspace');
const mongoose = require('mongoose');
const crypto = require('crypto');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokenUtils');

// @desc    Register a new user (default role: business owner)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, companyName, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email and password' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Custom role mapping (restrict admin role creation for security)
    const assignedRole = role && ['business owner', 'support agent'].includes(role) ? role : 'business owner';

    // Create verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: assignedRole,
      verificationToken,
      verificationExpires,
      isVerified: false,
    });

    // Create business if companyName is provided, or automatically create workspace
    const defaultBusinessName = companyName || `${username}'s Business`;
    const business = await Business.create({
      name: defaultBusinessName,
      owner: user._id,
      members: [{ user: user._id, role: assignedRole }],
    });

    // Create a matching Workspace with IDENTICAL _id as the Business so all queries are interchangeable
    const workspace = await Workspace.create({
      _id: business._id, // <-- KEY: same ID as business to unify queries
      name: defaultBusinessName,
      owner: user._id,
      settings: {},
    });

    // Update user business and workspace arrays together
    user.businesses.push(business._id);
    user.activeBusiness = business._id;
    user.workspaces.push(workspace._id);
    user.activeWorkspace = workspace._id;
    await user.save();

    // In a real environment, send verification email here
    console.log(`[Email Mock Service] Verification link sent to ${email}: /verify-email?token=${verificationToken}`);

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification email sent.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        activeBusiness: user.activeBusiness,
        businesses: [business],
        activeWorkspace: workspace._id,
        workspaces: [workspace],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Authenticate user & return dual tokens
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    let user = await User.findOne({ email }).select('+password').populate('businesses').populate('workspaces');

    // Auto-provision tester account if not found
    if (!user && email === 'tester123@example.com' && password === 'password123') {
      console.log('[Auto-Provision] Seeding default tester123@example.com account...');
      
      // 1. Create User
      const tempUser = await User.create({
        username: 'Tester Account',
        email: 'tester123@example.com',
        password: 'password123',
        role: 'business owner',
        isVerified: true,
      });

      // 2. Create Business
      const business = await Business.create({
        name: 'Rizora AI Workspace',
        owner: tempUser._id,
        members: [{ user: tempUser._id, role: 'business owner' }],
      });

      // 3. Create Workspace
      const workspace = await Workspace.create({
        _id: business._id,
        name: 'Rizora AI Workspace',
        owner: tempUser._id,
        settings: {},
      });

      tempUser.businesses.push(business._id);
      tempUser.activeBusiness = business._id;
      tempUser.workspaces.push(workspace._id);
      tempUser.activeWorkspace = workspace._id;
      await tempUser.save();

      // Refetch user to match query populate format
      user = await User.findOne({ email }).select('+password').populate('businesses').populate('workspaces');
    }

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Generate dual tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to rotation array
    user.refreshTokens.push(refreshToken);
    
    if (!user.activeBusiness && user.businesses.length > 0) {
      user.activeBusiness = user.businesses[0]._id;
    }

    // Sync activeWorkspace to match activeBusiness if missing
    if (!user.activeWorkspace && user.workspaces.length > 0) {
      user.activeWorkspace = user.workspaces[0]._id;
    }
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        activeBusiness: user.activeBusiness,
        businesses: user.businesses,
        activeWorkspace: user.activeWorkspace,
        workspaces: user.workspaces,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Rotate and issue new access & refresh tokens (Token Rotation security)
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Refresh token is required' });
    }

    // 1. Verify token signature
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return res.status(403).json({ success: false, error: 'Invalid refresh token signature' });
    }

    // 2. Fetch associated user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(403).json({ success: false, error: 'User associated with token not found' });
    }

    // 3. Check for Replay Attack / Token Theft
    const isTokenActive = user.refreshTokens.includes(token);
    if (!isTokenActive) {
      // Replay Attack Detected: Token has already been rotated/consumed!
      // Action: Wipe all existing user sessions/tokens to secure the account
      user.refreshTokens = [];
      await user.save();
      return res.status(403).json({
        success: false,
        error: 'Security Alert: Refresh token reuse detected! All active sessions have been revoked.',
      });
    }

    // 4. Rotate tokens: generate new Access + Refresh Token pair
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    // Replace the old consumed refresh token with the new rotated one
    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Verification token is required' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Token is invalid or has expired' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email successfully verified!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Request password recovery (Forgot Password)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'No user registered with this email' });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Mock Email Trigger
    console.log(`[Email Mock Service] Password reset token for ${email}: /reset-password?token=${resetToken}`);

    res.json({ success: true, message: 'Password recovery token dispatched to your email address.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reset password using recovery token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Token is invalid or has expired' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Revoke all existing sessions for security
    user.refreshTokens = [];
    await user.save();

    res.json({ success: true, message: 'Password successfully updated! All active sessions revoked.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Sign out and revoke refresh token
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  try {
    const { token } = req.body;

    if (token) {
      // Find user and remove refresh token
      await User.findOneAndUpdate(
        { refreshTokens: token },
        { $pull: { refreshTokens: token } }
      );
    }

    res.json({ success: true, message: 'Successfully logged out and session revoked.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('businesses').populate('workspaces');
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        activeBusiness: user.activeBusiness,
        businesses: user.businesses,
        activeWorkspace: user.activeWorkspace,
        workspaces: user.workspaces,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
