const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testLiveNotifications() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Simulate the exact logic from blood-requests/route.ts
    console.log('🩸 Testing live notification system...\n');
    
    // Create a test blood request (simulating what the API does)
    const bloodRequest = {
      _id: 'test-request-123',
      requesterId: 'test-requester',
      patientInfo: {
        name: 'Test Patient',
        age: 30,
        bloodType: 'A+',
        condition: 'Emergency surgery'
      },
      hospital: {
        name: 'Test Hospital',
        address: '123 Test St',
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        },
        contactNumber: '+1555123456'
      },
      urgencyLevel: 'critical',
      requiredUnits: 2,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      description: 'Emergency blood needed',
      status: 'active',
      createdAt: new Date()
    };
    
    // Step 1: Get all donors (same query as in API)
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
    
    console.log(`📋 Found ${allDonors.length} total donors`);
    
    // Step 2: Filter compatible donors (same logic as API)
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
    
    console.log(`🔍 Found ${compatibleDonors.length} compatible donors:`);
    compatibleDonors.forEach(donor => {
      console.log(`  ✓ ${donor.name} (${donor.bloodType}) - ${donor.phoneNumber}`);
    });
    
    // Step 3: Process notifications (same logic as API)
    console.log('\n📢 Processing notifications...');
    
    function checkDonationEligibility(donor, bloodRequest, maxDistance = 50) {
      const reasons = [];
      let isEligible = true;
      
      // Check blood type
      const bloodTypeMatch = canDonateToPatient(donor.bloodType, bloodRequest.patientInfo.bloodType);
      if (!bloodTypeMatch) {
        reasons.push(`Blood type ${donor.bloodType} not compatible with ${bloodRequest.patientInfo.bloodType}`);
        isEligible = false;
      }
      
      // Check availability
      const availabilityMatch = donor.medicalInfo?.availableForDonation !== false;
      if (!availabilityMatch) {
        reasons.push('Marked as unavailable for donation');
        isEligible = false;
      }
      
      return { isEligible, reasons, bloodTypeMatch, availabilityMatch };
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
    
    async function simulateSMSNotification(phoneNumber, message, urgent) {
      console.log(`📱 SMS to ${phoneNumber}:`);
      console.log(`   ${message}`);
      console.log(`   Urgent: ${urgent}`);
      return true; // Simulate success
    }
    
    const eligibleDonors = [];
    const smsMessage = createSMSMessage(bloodRequest);
    
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
      console.log(`   Notification prefs:`, notifyPrefs);
      
      // Send SMS if enabled
      if (notifyPrefs.sms && donor.phoneNumber) {
        await simulateSMSNotification(
          donor.phoneNumber, 
          smsMessage, 
          bloodRequest.urgencyLevel === 'critical'
        );
      } else {
        console.log(`   ❌ SMS not sent (SMS: ${notifyPrefs.sms}, Phone: ${!!donor.phoneNumber})`);
      }
      
      // Send in-app notification if enabled
      if (notifyPrefs.inApp) {
        console.log(`   ✅ In-app notification would be sent`);
      }
    }
    
    console.log(`\n✅ Notification processing completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total donors: ${allDonors.length}`);
    console.log(`   - Compatible donors: ${compatibleDonors.length}`);
    console.log(`   - Eligible donors: ${eligibleDonors.length}`);
    console.log(`   - Notifications sent: ${eligibleDonors.filter(d => shouldNotifyUser(d, bloodRequest).sms).length}`);
    
    // If no notifications would be sent, show why
    if (eligibleDonors.length === 0) {
      console.log('\n⚠️  No notifications were sent. Checking reasons...');
      compatibleDonors.forEach(donor => {
        const eligibility = checkDonationEligibility(donor, bloodRequest, 50);
        const notifyPrefs = shouldNotifyUser(donor, bloodRequest);
        console.log(`   ${donor.name}: Eligible=${eligibility.isEligible}, SMS=${notifyPrefs.sms}, Phone=${!!donor.phoneNumber}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing live notifications:', error);
  } finally {
    await client.close();
  }
}

testLiveNotifications();