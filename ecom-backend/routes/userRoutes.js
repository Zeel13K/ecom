const express = require('express');
const { registerUser, authUser, getUserProfile, updateUserProfile, getAllUsers } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// For development, temporarily allow GET access without authentication
router.route('/')
  .post(registerUser)
  .get(getAllUsers); // Removed protect and admin middleware temporarily

router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

module.exports = router;
