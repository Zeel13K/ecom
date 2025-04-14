const Order = require('../models/order');
const mongoose = require('mongoose');

// Utility function to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Utility function to format error response
const formatErrorResponse = (error) => {
  if (error.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map(err => err.message);
    return {
      status: 400,
      message: 'Validation error in order data',
      errors: validationErrors
    };
  } else if (error.name === 'CastError') {
    return {
      status: 400,
      message: 'Invalid ID format'
    };
  }
  return {
    status: 500,
    message: 'Server error',
    error: error.message
  };
};

const addOrderItems = async (req, res) => {
  try {
    console.log('Creating new order:', req.body);
    console.log('User from auth middleware:', req.user);

    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

    // Input validation
    if (!orderItems?.length) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: 'User not authenticated or invalid user ID' });
    }

    // Validate prices
    const prices = [itemsPrice, taxPrice, shippingPrice, totalPrice];
    if (prices.some(price => typeof Number(price) !== 'number' || isNaN(Number(price)))) {
      return res.status(400).json({ message: 'Invalid price values provided' });
    }

    // Validate each product ID and format order items
    const validatedOrderItems = orderItems.map(item => ({
      ...item,
      product: isValidObjectId(item.product) ? new mongoose.Types.ObjectId(item.product) : null
    }));

    const invalidItems = validatedOrderItems.filter(item => !item.product);
    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid product IDs found',
        invalidItems
      });
    }

    const order = new Order({
      orderItems: validatedOrderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice: Number(itemsPrice),
      taxPrice: Number(taxPrice),
      shippingPrice: Number(shippingPrice),
      totalPrice: Number(totalPrice),
      status: 'processing'
    });

    const createdOrder = await order.save();
    console.log('Order saved successfully:', createdOrder._id);
    
    // Populate user details in the response
    await createdOrder.populate('user', 'name email');
    
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    const errorResponse = formatErrorResponse(error);
    res.status(errorResponse.status).json(errorResponse);
  }
};

const getOrderById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name price')
      .populate('statusHistory.updatedBy', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has permission to view this order
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    // Sort status history by timestamp (newest first)
    if (order.statusHistory && order.statusHistory.length > 0) {
      order.statusHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    const errorResponse = formatErrorResponse(error);
    res.status(errorResponse.status).json(errorResponse);
  }
};

const updateOrderToPaid = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order payment:', error);
    const errorResponse = formatErrorResponse(error);
    res.status(errorResponse.status).json(errorResponse);
  }
};

const updateOrderToDelivered = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isDelivered) {
      return res.status(400).json({ message: 'Order is already marked as delivered' });
    }

    if (!order.isPaid) {
      return res.status(400).json({ message: 'Order must be paid before marking as delivered' });
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = 'delivered';
    
    // Add to status history
    order.statusHistory.push({
      status: 'delivered',
      timestamp: Date.now(),
      updatedBy: req.user._id
    });

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order delivery:', error);
    const errorResponse = formatErrorResponse(error);
    res.status(errorResponse.status).json(errorResponse);
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('orderItems.product', 'name price image')
      .select('_id orderItems createdAt status isPaid isDelivered totalPrice shippingAddress statusUpdatedAt paymentMethod');

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    const errorResponse = formatErrorResponse(error);
    res.status(errorResponse.status).json(errorResponse);
  }
};

const getOrders = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;
    const status = req.query.status;

    let query = {};
    if (status && ['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    res.json({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    const errorResponse = formatErrorResponse(error);
    res.status(errorResponse.status).json(errorResponse);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const { status } = req.body;
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: processing, shipped, delivered, cancelled' 
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status transitions
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update status of cancelled order' });
    }
    if (order.status === 'delivered' && status !== 'delivered') {
      return res.status(400).json({ message: 'Cannot change status of delivered order' });
    }
    if (status === 'delivered' && !order.isPaid) {
      return res.status(400).json({ message: 'Cannot mark unpaid order as delivered' });
    }

    // Status is the same, no need to update
    if (order.status === status.toLowerCase()) {
      console.log(`Order ${order._id} status already set to ${status.toLowerCase()}`);
      return res.json({
        success: true,
        message: 'Order status already set',
        order: order
      });
    }

    // Update status and timestamp
    order.status = status.toLowerCase();
    order.statusUpdatedAt = Date.now();
    
    // Initialize statusHistory array if it doesn't exist
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    // Create status update entry
    const statusUpdate = {
      status: status.toLowerCase(),
      timestamp: Date.now(),
      updatedBy: req.user ? req.user._id : null,
      note: req.body.note || `Status updated to ${status}`
    };
    
    // Add to status history
    order.statusHistory.push(statusUpdate);

    // Save changes
    const updatedOrder = await order.save();
    
    // Populate user information in status history if available
    if (req.user && req.user._id) {
      await updatedOrder.populate('statusHistory.updatedBy', 'name email');
    }

    console.log(`Order ${order._id} status updated to ${status.toLowerCase()}`);

    // Return detailed response with full order information
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder,
      statusUpdate: statusUpdate
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    const errorResponse = formatErrorResponse(error);
    res.status(errorResponse.status).json(errorResponse);
  }
};

module.exports = { 
  addOrderItems, 
  getOrderById, 
  updateOrderToPaid, 
  updateOrderToDelivered, 
  getMyOrders, 
  getOrders,
  updateOrderStatus
};
