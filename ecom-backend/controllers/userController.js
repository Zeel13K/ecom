const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    console.log(`Registration attempt - Email: ${email}`);
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Convert email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase().trim();
    
    // Log database query
    console.log(`Checking if email exists: ${normalizedEmail}`);
    
    // Find user with normalized email
    const userExists = await User.findOne({ email: normalizedEmail });
    
    // Log result of database query
    console.log(`User exists check result: ${userExists ? 'Found' : 'Not found'}`);
    
    if (userExists) {
      console.log(`Email already registered: ${normalizedEmail}`);
      return res.status(400).json({ 
        message: 'Email is already registered. Please log in or use a different email address.' 
      });
    }

    // Create user with normalized email
    console.log(`Creating new user with email: ${normalizedEmail}`);
    const user = await User.create({ 
      name, 
      email: normalizedEmail, 
      password 
    });

    if (user) {
      console.log(`User created successfully: ${user._id}`);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      console.log('Failed to create user');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: error.message 
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login', 
      error: error.message 
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Server error while retrieving profile', 
      error: error.message 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      // Check if new email already exists for another user
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email.toLowerCase() });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use by another account' });
        }
      }
      
      user.name = req.body.name || user.name;
      if (req.body.email) {
        user.email = req.body.email.toLowerCase();
      }
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Server error while updating profile', 
      error: error.message 
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    
    // For development - return mock data if database query fails
    if (process.env.NODE_ENV !== 'production') {
      console.log('DEVELOPMENT MODE: Returning mock user data');
      
      const mockUsers = [
        {
          _id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          isAdmin: true,
          createdAt: '2023-01-10T10:00:00Z'
        },
        {
          _id: 'user2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          isAdmin: false,
          createdAt: '2023-02-15T14:30:00Z'
        },
        {
          _id: 'user3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          isAdmin: false,
          createdAt: '2023-03-20T09:15:00Z'
        },
        {
          _id: 'user4',
          name: 'Admin User',
          email: 'admin@example.com',
          isAdmin: true,
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];
      
      return res.json(mockUsers);
    }
    
    res.status(500).json({ 
      message: 'Server error while retrieving users', 
      error: error.message 
    });
  }
};

module.exports = { registerUser, authUser, getUserProfile, updateUserProfile, getAllUsers };
