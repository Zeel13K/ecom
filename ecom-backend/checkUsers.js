const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      const users = await User.find({}, 'name email createdAt');
      console.log('\nRegistered Users:');
      users.forEach(user => {
        console.log(`\nName: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('------------------------');
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    mongoose.disconnect();
  })
  .catch(err => console.error('Connection error:', err)); 