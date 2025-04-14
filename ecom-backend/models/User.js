const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create email schema type with lowercase transformer
const emailSchema = {
  type: String,
  required: true,
  unique: true,
  trim: true,
  lowercase: true, // Automatically convert to lowercase when saving
  match: [
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    'Please enter a valid email address'
  ]
};

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: emailSchema,
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with stored hash
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
