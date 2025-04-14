const express = require('express');
const { 
  addOrderItems, 
  getOrderById, 
  updateOrderToPaid, 
  updateOrderToDelivered, 
  getMyOrders, 
  getOrders,
  updateOrderStatus 
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders);

// @route   GET /api/orders/myorders
// @desc    Get logged in user's orders
// @access  Private
router.route('/myorders')
  .get(protect, getMyOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.route('/:id')
  .get(protect, getOrderById);

// @route   PUT /api/orders/:id/pay
// @desc    Update order to paid
// @access  Private
router.route('/:id/pay')
  .put(protect, updateOrderToPaid);

// @route   PUT /api/orders/:id/deliver
// @desc    Update order to delivered
// @access  Private/Admin
router.route('/:id/deliver')
  .put(protect, admin, updateOrderToDelivered);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

module.exports = router;
