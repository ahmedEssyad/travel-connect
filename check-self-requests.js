const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkSelfRequests() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const bloodRequestsCollection = db.collection('bloodrequests');
    
    console.log('🕵️ Checking for self-request issue...\n');
    
    // Get your user accounts
    const yourPhoneNumbers = ['+22242548647', '+22248334893'];
    const yourAccounts = await usersCollection.find({
      phoneNumber: { $in: yourPhoneNumbers }
    }, {
      projection: { _id: 1, name: 1, phoneNumber: 1, bloodType: 1 }
    }).toArray();
    
    console.log('👤 Your accounts:');
    yourAccounts.forEach(account => {
      console.log(`   ${account.name} (${account.phoneNumber}) - ID: ${account._id}`);
    });
    
    // Get recent blood requests
    const recentRequests = await bloodRequestsCollection.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log('\n📋 Recent blood requests:');
    
    for (const request of recentRequests) {
      console.log(`\n🩸 Request ${request._id}:`);
      console.log(`   Blood Type: ${request.patientInfo?.bloodType}`);
      console.log(`   Urgency: ${request.urgencyLevel}`);
      console.log(`   Requester ID: ${request.requesterId}`);
      console.log(`   Created: ${request.createdAt}`);
      
      // Check if requester is one of your accounts
      const isYourRequest = yourAccounts.some(account => 
        account._id.toString() === request.requesterId.toString()
      );
      
      if (isYourRequest) {
        const requester = yourAccounts.find(account => 
          account._id.toString() === request.requesterId.toString()
        );
        console.log(`   🔴 This is YOUR request (created by ${requester.name})`);
        console.log(`   ❌ You won't receive notifications for your own requests`);
      } else {
        console.log(`   ✅ This is not your request - you should receive notifications`);
      }
    }
    
    console.log('\n💡 Solution:');
    console.log('To test notifications properly:');
    console.log('1. Create a blood request with Account A');
    console.log('2. Account B should receive notifications (if compatible)');
    console.log('3. Or create a separate test account for creating requests');
    
    // Show which accounts can notify which
    console.log('\n📊 Notification Matrix:');
    console.log('If these accounts create requests, who gets notified:');
    
    for (const requester of yourAccounts) {
      console.log(`\n📋 If ${requester.name} creates an ${requester.bloodType} request:`);
      
      const otherAccounts = yourAccounts.filter(acc => acc._id.toString() !== requester._id.toString());
      
      if (otherAccounts.length === 0) {
        console.log(`   ❌ No other accounts to notify`);
      } else {
        otherAccounts.forEach(recipient => {
          // Check blood compatibility
          const compatibility = {
            'A+': ['A+', 'A-', 'O+', 'O-'],
            'A-': ['A-', 'O-'],
            'B+': ['B+', 'B-', 'O+', 'O-'],
            'B-': ['B-', 'O-'],
            'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            'AB-': ['A-', 'B-', 'AB-', 'O-'],
            'O+': ['O+', 'O-'],
            'O-': ['O-']
          };
          
          const canDonate = compatibility[requester.bloodType]?.includes(recipient.bloodType);
          
          console.log(`   ${canDonate ? '✅' : '❌'} ${recipient.name} (${recipient.bloodType}) - ${canDonate ? 'Compatible' : 'Incompatible'}`);
        });
      }
    }
    
    // Create a test request with a different account
    console.log('\n🚀 Creating test request with different requester...');
    
    // Create a temporary requester account
    const testRequester = {
      phoneNumber: '+1234567999',
      name: 'Test Requester (Not Donor)',
      bloodType: 'B+',
      medicalInfo: {
        isDonor: false,
        availableForDonation: false
      },
      notificationPreferences: {
        sms: false,
        push: false,
        urgencyLevels: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const requesterResult = await usersCollection.updateOne(
      { phoneNumber: testRequester.phoneNumber },
      { $set: testRequester },
      { upsert: true }
    );
    
    const requesterId = requesterResult.upsertedId || 
      (await usersCollection.findOne({ phoneNumber: testRequester.phoneNumber }))._id;
    
    // Create test blood request
    const testBloodRequest = {
      requesterId: requesterId.toString(),
      patientInfo: {
        name: 'Test Patient for Notifications',
        age: 30,
        bloodType: 'A+', // Your accounts can donate to this
        condition: 'Testing notification system'
      },
      hospital: {
        name: 'Test Hospital for Notifications',
        address: '123 Test St',
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        },
        contactNumber: '+1555111222'
      },
      urgencyLevel: 'critical',
      requiredUnits: 1,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      description: 'Test blood request to trigger notifications',
      status: 'active',
      fulfilledUnits: 0,
      matchedDonors: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const requestResult = await bloodRequestsCollection.insertOne(testBloodRequest);
    
    console.log(`✅ Created test blood request: ${requestResult.insertedId}`);
    console.log(`📱 This should trigger SMS notifications to your donor accounts!`);
    console.log(`🩸 Blood type needed: A+ (your accounts are compatible)`);
    console.log(`🚨 Urgency: critical`);
    
    console.log('\n⏰ Check your phone for SMS notifications in the next few seconds...');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkSelfRequests();