const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testBloodRequestAPI() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Get testeur account to create a token
    const testeur = await usersCollection.findOne({ phoneNumber: '+22248334893' });
    
    if (!testeur) {
      console.log('❌ Testeur account not found');
      return;
    }
    
    console.log('🧪 Testing blood request creation API...\n');
    
    // Simulate creating a blood request that should trigger notifications
    const bloodRequestData = {
      patientInfo: {
        name: 'API Test Patient',
        age: 35,
        bloodType: 'A+',
        condition: 'Emergency surgery requiring blood'
      },
      hospital: {
        name: 'API Test Hospital',
        address: '123 API Test St',
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        },
        contactNumber: '+1555987654'
      },
      urgencyLevel: 'critical',
      requiredUnits: 2,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      description: 'API test - should trigger notifications to Mohamed'
    };
    
    console.log('📋 Blood request data:');
    console.log(JSON.stringify(bloodRequestData, null, 2));
    
    // Directly insert into database to simulate what the API should do
    console.log('\n💉 Directly testing notification logic...');
    
    // Insert blood request directly
    const bloodRequest = {
      ...bloodRequestData,
      requesterId: testeur._id.toString(),
      status: 'active',
      fulfilledUnits: 0,
      matchedDonors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: new Date(bloodRequestData.deadline)
    };
    
    const bloodRequestsCollection = db.collection('bloodrequests');
    const insertResult = await bloodRequestsCollection.insertOne(bloodRequest);
    
    console.log(`✅ Inserted blood request: ${insertResult.insertedId}`);
    
    // Now run the exact notification logic from the API
    console.log('\n📢 Running notification logic...');
    
    // Get all donors (same query as API)
    const maxNotifications = 50;
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
    })
    .limit(maxNotifications * 2)
    .toArray();
    
    console.log(`Found ${allDonors.length} total donors`);
    
    // Find compatible donors (same logic as API)
    function canDonateToPatient(donorBloodType, patientBloodType) {
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
      
      return compatibility[patientBloodType]?.includes(donorBloodType) || false;
    }
    
    const compatibleDonors = allDonors.filter(donor => {
      return donor.bloodType && canDonateToPatient(donor.bloodType, bloodRequest.patientInfo.bloodType);
    });
    
    console.log(`Found ${compatibleDonors.length} compatible donors:`);
    compatibleDonors.forEach(donor => {
      console.log(`  ✓ ${donor.name} (${donor.bloodType}) - ${donor.phoneNumber}`);
    });
    
    // Process notifications (same logic as API)
    function checkDonationEligibility(donor, bloodRequest, maxDistance = 50) {
      const reasons = [];
      let isEligible = true;
      
      // Check blood type
      const bloodTypeMatch = canDonateToPatient(donor.bloodType, bloodRequest.patientInfo.bloodType);
      if (!bloodTypeMatch) {
        reasons.push(`Blood type ${donor.bloodType} not compatible`);
        isEligible = false;
      }
      
      // Check availability
      const availabilityMatch = donor.medicalInfo?.availableForDonation !== false;
      if (!availabilityMatch) {
        reasons.push('Not available for donation');
        isEligible = false;
      }
      
      // Check if already responded
      const alreadyResponded = bloodRequest.matchedDonors?.some(
        (d) => d.donorId === donor._id.toString()
      );
      if (alreadyResponded) {
        reasons.push('Already responded');
        isEligible = false;
      }
      
      // Check if it's user's own request
      if (bloodRequest.requesterId === donor._id.toString()) {
        reasons.push('Own request');
        isEligible = false;
      }
      
      return { isEligible, reasons };
    }
    
    function shouldNotifyUser(donor, bloodRequest) {
      const preferences = donor.notificationPreferences || {
        sms: true,
        push: true,
        urgencyLevels: ['critical', 'urgent', 'standard']
      };
      
      const shouldNotify = preferences.urgencyLevels.includes(bloodRequest.urgencyLevel);
      
      return {
        sms: shouldNotify && preferences.sms,
        push: shouldNotify && preferences.push,
        inApp: shouldNotify
      };
    }
    
    function createSMSMessage(bloodRequest) {
      const urgencyText = bloodRequest.urgencyLevel === 'critical' ? 'URGENT' : 
                         bloodRequest.urgencyLevel === 'urgent' ? 'Urgent' : '';
      
      return `${urgencyText} BloodConnect: ${bloodRequest.patientInfo.bloodType} blood needed for ${bloodRequest.patientInfo.name} at ${bloodRequest.hospital.name}. Can you help? Open app to respond.`;
    }
    
    const eligibleDonors = [];
    const smsMessage = createSMSMessage(bloodRequest);
    
    console.log('\n📱 Processing notifications:');
    
    for (const donor of compatibleDonors) {
      console.log(`\n👤 Processing ${donor.name}:`);
      
      // Check eligibility
      const eligibility = checkDonationEligibility(donor, bloodRequest, 50);
      console.log(`   Eligible: ${eligibility.isEligible}`);
      if (!eligibility.isEligible) {
        console.log(`   Reasons: ${eligibility.reasons.join(', ')}`);
        continue;
      }
      
      eligibleDonors.push(donor);
      
      // Check notification preferences
      const notifyPrefs = shouldNotifyUser(donor, bloodRequest);
      console.log(`   SMS enabled: ${notifyPrefs.sms}`);
      
      // Send SMS if enabled
      if (notifyPrefs.sms && donor.phoneNumber) {
        console.log(`   📤 Sending SMS to ${donor.phoneNumber}`);
        console.log(`   📝 Message: ${smsMessage}`);
        
        try {
          const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          
          const result = await twilio.messages.create({
            body: smsMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: donor.phoneNumber
          });
          
          console.log(`   ✅ SMS sent! SID: ${result.sid}`);
        } catch (smsError) {
          console.log(`   ❌ SMS failed: ${smsError.message}`);
        }
      } else {
        console.log(`   ❌ SMS not sent (enabled: ${notifyPrefs.sms}, phone: ${!!donor.phoneNumber})`);
      }
    }
    
    console.log(`\n✅ Notification processing completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total donors: ${allDonors.length}`);
    console.log(`   - Compatible donors: ${compatibleDonors.length}`);
    console.log(`   - Eligible donors: ${eligibleDonors.length}`);
    console.log(`   - SMS notifications sent: ${eligibleDonors.filter(d => shouldNotifyUser(d, bloodRequest).sms).length}`);
    
    console.log('\n💡 This test simulates exactly what the API should do.');
    console.log('If you received SMS notifications, the API logic is working.');
    console.log('If not, check the Next.js server logs when creating requests through the UI.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testBloodRequestAPI();