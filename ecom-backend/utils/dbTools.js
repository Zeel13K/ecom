const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Utility functions for database maintenance
 * Run with: node utils/dbTools.js [command] [params]
 * 
 * Available commands:
 * - listUsers: List all users
 * - findEmail [email]: Find user by email
 * - deleteUser [email]: Delete user by email
 * - resetDb: CAUTION - Reset database
 * - checkDb: Check database connection and collections
 * - checkCollections: List all collections in the database
 * - checkIndexes: Check indexes on the User collection
 */

const connectToDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log(`Using MongoDB URI: ${maskConnectionString(process.env.MONGODB_URI)}`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    return false;
  }
};

// Mask connection string for security when logging
const maskConnectionString = (uri) => {
  if (!uri) return 'undefined';
  try {
    const urlObj = new URL(uri);
    if (urlObj.password) {
      urlObj.password = '****';
    }
    return urlObj.toString();
  } catch (e) {
    return uri.replace(/:[^:@]+@/, ':****@');
  }
};

const listUsers = async () => {
  try {
    const users = await User.find({}).select('name email isAdmin createdAt');
    console.log('\n===== REGISTERED USERS =====');
    
    if (users.length === 0) {
      console.log('No users found in the database');
    } else {
      users.forEach((user, index) => {
        console.log(`\n--- USER ${index + 1} ---`);
        console.log(`ID: ${user._id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Admin: ${user.isAdmin}`);
        console.log(`Created: ${user.createdAt}`);
      });
      console.log(`\nTotal users: ${users.length}`);
    }
  } catch (error) {
    console.error('Error listing users:', error);
  }
};

const findUserByEmail = async (email) => {
  if (!email) {
    console.error('Email parameter is required');
    return;
  }
  
  try {
    // Try exact match first
    let user = await User.findOne({ email: email });
    
    if (!user) {
      // If no exact match, try case-insensitive match
      console.log('No exact match found, trying case-insensitive search...');
      user = await User.findOne({ 
        email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, 'i') } 
      });
    }
    
    if (user) {
      console.log('\n===== USER FOUND =====');
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Admin: ${user.isAdmin}`);
      console.log(`Created: ${user.createdAt}`);
    } else {
      console.log(`No user found with email similar to: ${email}`);
    }
  } catch (error) {
    console.error('Error finding user:', error);
  }
};

// Helper to escape special characters in regex
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const deleteUserByEmail = async (email) => {
  if (!email) {
    console.error('Email parameter is required');
    return;
  }
  
  try {
    console.log(`Attempting to delete user with email: ${email}`);
    
    // Try with exact match first
    let user = await User.findOne({ email: email });
    
    // If not found, try case-insensitive
    if (!user) {
      console.log('No exact match found, trying case-insensitive search...');
      user = await User.findOne({ 
        email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, 'i') } 
      });
    }
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return;
    }
    
    console.log(`Found user: ${user.email} (${user._id})`);
    await User.deleteOne({ _id: user._id });
    console.log(`User deleted successfully: ${user.email}`);
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};

const checkDatabase = async () => {
  try {
    console.log('\n===== DATABASE INFORMATION =====');
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`Host: ${mongoose.connection.host}`);
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    console.log('\n--- Database Stats ---');
    console.log(`Collections: ${stats.collections}`);
    console.log(`Documents: ${stats.objects}`);
    console.log(`Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n--- User Model Information ---');
    console.log(`Collection: ${User.collection.name}`);
    
    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const userCollectionExists = collections.some(c => c.name === User.collection.name);
    console.log(`Collection Exists: ${userCollectionExists}`);
    
    if (userCollectionExists) {
      // Count documents
      const userCount = await User.countDocuments();
      console.log(`User Count: ${userCount}`);
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
};

const listCollections = async () => {
  try {
    console.log('\n===== DATABASE COLLECTIONS =====');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('No collections found in the database');
    } else {
      collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.name}`);
      });
      console.log(`\nTotal collections: ${collections.length}`);
    }
  } catch (error) {
    console.error('Error listing collections:', error);
  }
};

const checkIndexes = async () => {
  try {
    console.log('\n===== USER COLLECTION INDEXES =====');
    const indexes = await User.collection.indexes();
    
    if (indexes.length === 0) {
      console.log('No indexes found on User collection');
    } else {
      indexes.forEach((index, i) => {
        console.log(`\n--- INDEX ${i + 1} ---`);
        console.log(`Name: ${index.name}`);
        console.log(`Keys: ${JSON.stringify(index.key)}`);
        console.log(`Unique: ${index.unique || false}`);
      });
      
      // Check if email has a unique index
      const hasUniqueEmailIndex = indexes.some(
        index => index.unique && index.key && index.key.email
      );
      
      console.log(`\nEmail Unique Index: ${hasUniqueEmailIndex ? 'Yes' : 'No'}`);
      
      if (!hasUniqueEmailIndex) {
        console.log('\nWARNING: The email field does not have a unique index.');
        console.log('This could cause issues with the email uniqueness constraint.');
      }
    }
  } catch (error) {
    console.error('Error checking indexes:', error);
  }
};

const resetDb = async () => {
  const answer = await askQuestion(
    'WARNING: This will delete ALL users. Type "CONFIRM" to proceed: '
  );
  
  if (answer.trim() !== 'CONFIRM') {
    console.log('Database reset cancelled');
    return;
  }
  
  try {
    await User.deleteMany({});
    console.log('All users have been deleted from the database');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
};

// Helper function for console input
const askQuestion = (question) => {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Command processing
const processCommand = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];
  
  const connected = await connectToDB();
  if (!connected && command !== 'help') {
    console.error('Failed to connect to database. Cannot proceed with command.');
    process.exit(1);
  }
  
  switch (command) {
    case 'listUsers':
      await listUsers();
      break;
    case 'findEmail':
      await findUserByEmail(param);
      break;
    case 'deleteUser':
      await deleteUserByEmail(param);
      break;
    case 'resetDb':
      await resetDb();
      break;
    case 'checkDb':
      await checkDatabase();
      break;
    case 'checkCollections':
      await listCollections();
      break;
    case 'checkIndexes':
      await checkIndexes();
      break;
    case 'help':
    default:
      console.log(`
Usage: node utils/dbTools.js [command] [params]

Available commands:
- listUsers                List all users
- findEmail [email]        Find user by email (case-insensitive)
- deleteUser [email]       Delete user by email (case-insensitive)
- resetDb                  CAUTION - Reset database (delete all users)
- checkDb                  Check database connection and info
- checkCollections         List all collections in database
- checkIndexes             Check indexes on User collection
- help                     Show this help message
      `);
  }
  
  mongoose.disconnect();
};

// Run if called directly
if (require.main === module) {
  processCommand();
}

module.exports = {
  connectToDB,
  listUsers,
  findUserByEmail,
  deleteUserByEmail,
  checkDatabase,
  listCollections,
  checkIndexes
}; 