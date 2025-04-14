const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * This script attempts to fix database issues by:
 * 1. Connecting to the database
 * 2. Dropping the users collection if it exists
 * 3. Re-creating the collection with proper indexes
 * 
 * Run with: node utils/fixDatabase.js
 */

const connectToDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    return false;
  }
};

const fixDatabase = async () => {
  try {
    console.log('\n===== FIXING DATABASE =====');
    
    // 1. Drop the users collection if it exists
    try {
      console.log('Dropping users collection...');
      await mongoose.connection.db.dropCollection('users');
      console.log('Users collection dropped successfully');
    } catch (error) {
      // Collection might not exist
      console.log('Collection drop failed. It might not exist:', error.message);
    }
    
    // 2. Create a user to test the schema and indexes
    console.log('\nCreating test user to initialize schema and indexes...');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    await testUser.save();
    console.log('Test user created successfully');
    
    // 3. Verify the indexes
    console.log('\nVerifying indexes...');
    const indexes = await User.collection.indexes();
    console.log(`Found ${indexes.length} indexes on users collection`);
    
    // Check for email unique index
    const hasEmailIndex = indexes.some(index => 
      index.key && index.key.email && index.unique
    );
    
    if (hasEmailIndex) {
      console.log('Email unique index is properly configured');
    } else {
      console.log('WARNING: Email unique index not found');
    }
    
    // 4. Delete the test user
    console.log('\nRemoving test user...');
    await User.deleteOne({ email: 'test@example.com' });
    console.log('Test user removed');
    
    console.log('\n===== DATABASE FIX COMPLETE =====');
    console.log('Your database should now be properly configured.');
    console.log('You can now register new users.');
    
  } catch (error) {
    console.error('Error fixing database:', error);
  }
};

// Run the fix
connectToDB()
  .then(connected => {
    if (connected) {
      return fixDatabase();
    } else {
      console.error('Cannot fix database: Connection failed');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  })
  .finally(() => {
    // Close database connection
    mongoose.disconnect();
  }); 