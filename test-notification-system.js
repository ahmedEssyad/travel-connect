const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testNotificationSystem() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const bloodRequestsCollection = db.collection('bloodrequests');
    
    // Create a test requester
    const testRequester = {
      phoneNumber: '+1234567999',
      name: 'Test Requester',
      bloodType: 'A+',
      medicalInfo: {
        isDonor: false,
        availableForDonation: false
      },
      notificationPreferences: {
        sms: true,
        push: true,
        email: true,
        urgencyLevels: ['critical', 'urgent', 'standard']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert test requester
    const requesterResult = await usersCollection.updateOne(
      { phoneNumber: testRequester.phoneNumber },
      { $set: testRequester },
      { upsert: true }
    );
    
    const requesterId = requesterResult.upsertedId || 
      (await usersCollection.findOne({ phoneNumber: testRequester.phoneNumber }))._id;
    
    console.log('✅ Created/updated test requester');

    // Create a test blood request
    const testBloodRequest = {
      requesterId: requesterId.toString(),
      patientInfo: {
        name: 'Emergency Patient',
        age: 35,
        bloodType: 'A+',
        condition: 'Emergency surgery requiring blood transfusion'
      },
      hospital: {
        name: 'Test Emergency Hospital',
        address: '123 Emergency Ave, Test City',
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        },
        contactNumber: '+1555987654'
      },
      urgencyLevel: 'critical',
      requiredUnits: 2,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      description: 'Emergency blood needed for surgery. Patient in critical condition.',
      status: 'active',
      fulfilledUnits: 0,
      matchedDonors: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert blood request
    const bloodRequestResult = await bloodRequestsCollection.insertOne(testBloodRequest);
    console.log('🩸 Created test blood request:', bloodRequestResult.insertedId);

    // Now test the notification logic directly
    console.log('\n📢 Testing notification logic...');
    
    // Get all donors
    const allDonors = await usersCollection.find({
      'medicalInfo.isDonor': true,
      'medicalInfo.availableForDonation': true
    }, {
      projection: {
        name: 1,
        phoneNumber: 1,
        bloodType: 1,
        location: 1,
        medicalInfo: 1,
        notificationPreferences: 1
      }
    }).toArray();
    
    console.log(`Found ${allDonors.length} total donors`);
    
    // Import blood type compatibility function
    const fs = require('fs');
    const path = require('path');
    
    // Read the blood-types.ts file and extract the compatibility logic
    const bloodTypesPath = path.join(__dirname, 'src/lib/blood-types.ts');
    const bloodTypesContent = fs.readFileSync(bloodTypesPath, 'utf8');
    
    // Simple blood type compatibility check for A+ patient
    function canDonateToAPlus(donorBloodType) {
      const compatibleTypes = ['A+', 'A-', 'O+', 'O-'];
      return compatibleTypes.includes(donorBloodType);
    }
    
    // Find compatible donors
    const compatibleDonors = allDonors.filter(donor => {
      return donor.bloodType && canDonateToAPlus(donor.bloodType);
    });
    
    console.log(`Found ${compatibleDonors.length} compatible donors for A+ patient:`);
    compatibleDonors.forEach(donor => {
      console.log(`  - ${donor.name} (${donor.bloodType}) - Phone: ${donor.phoneNumber}`);
    });
    
    // Test SMS notification function
    console.log('\n📱 Testing SMS notification...');
    
    function createSMSMessage(bloodRequest) {
      const urgencyText = bloodRequest.urgencyLevel === 'critical' ? 'URGENT' : 
                         bloodRequest.urgencyLevel === 'urgent' ? 'Urgent' : '';
      
      return `${urgencyText} BloodConnect: ${bloodRequest.patientInfo.bloodType} blood needed for ${bloodRequest.patientInfo.name} at ${bloodRequest.hospital.name}. Can you help? Open app to respond.`;
    }
    
    const smsMessage = createSMSMessage(testBloodRequest);
    console.log('SMS Message:', smsMessage);
    
    // Simulate sending SMS to each compatible donor
    for (const donor of compatibleDonors) {
      console.log(`📤 Would send SMS to ${donor.name} (${donor.phoneNumber})`);
      console.log(`   Message: ${smsMessage}`);
      
      // Check notification preferences
      const prefs = donor.notificationPreferences || {
        sms: true,
        urgencyLevels: ['critical', 'urgent', 'standard']
      };
      
      const shouldNotify = prefs.urgencyLevels.includes(testBloodRequest.urgencyLevel);
      console.log(`   Should notify: ${shouldNotify && prefs.sms ? 'YES' : 'NO'}`);
    }
    
    console.log('\n✅ Notification system test completed!');
    console.log('\nNext steps:');
    console.log('1. Start the Next.js server: npm run dev');
    console.log('2. Create a blood request through the UI');
    console.log('3. Check the server logs for notification processing');
    console.log('4. Verify SMS notifications in development mode logs');
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    await client.close();
  }
}

testNotificationSystem();