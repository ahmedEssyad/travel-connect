const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function enableSMSForUser(phoneNumber) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Update user's notification preferences
    const result = await usersCollection.updateOne(
      { phoneNumber: phoneNumber },
      { 
        $set: { 
          'notificationPreferences.sms': true,
          'notificationPreferences.push': true,
          'notificationPreferences.email': true,
          'notificationPreferences.urgencyLevels': ['critical', 'urgent', 'standard']
        } 
      }
    );
    
    if (result.matchedCount > 0) {
      console.log(`✅ SMS notifications enabled for ${phoneNumber}`);
    } else {
      console.log(`❌ User with phone number ${phoneNumber} not found`);
    }
    
  } catch (error) {
    console.error('❌ Error enabling SMS:', error);
  } finally {
    await client.close();
  }
}

// Enable SMS for specific users
async function enableSMSForAllTestUsers() {
  const testUsers = [
    '+22242548647', // Mohamed Essyad
    '+22248334893'  // testeur
  ];
  
  for (const phone of testUsers) {
    await enableSMSForUser(phone);
  }
}

// Run the function
enableSMSForAllTestUsers();