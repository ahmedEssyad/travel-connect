const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function debugAPlusRequest() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const bloodRequestsCollection = db.collection('bloodrequests');
    
    console.log('🕵️ Debugging A+ request created by testeur...\n');
    
    // Find testeur and Mohamed accounts
    const testeur = await usersCollection.findOne({ phoneNumber: '+22248334893' });
    const mohamed = await usersCollection.findOne({ phoneNumber: '+22242548647' });
    
    console.log('👤 Account Details:');
    console.log(`Testeur ID: ${testeur._id}`);
    console.log(`Mohamed ID: ${mohamed._id}`);
    console.log(`Mohamed Blood Type: ${mohamed.bloodType}`);
    console.log(`Mohamed is Donor: ${mohamed.medicalInfo?.isDonor}`);
    console.log(`Mohamed Available: ${mohamed.medicalInfo?.availableForDonation}`);
    console.log(`Mohamed SMS enabled: ${mohamed.notificationPreferences?.sms}`);
    
    // Find the most recent A+ request created by testeur
    const recentAPlusRequest = await bloodRequestsCollection.findOne({
      requesterId: testeur._id.toString(),
      'patientInfo.bloodType': 'A+'
    }, {
      sort: { createdAt: -1 }
    });
    
    if (!recentAPlusRequest) {
      console.log('❌ No A+ request found created by testeur');
      return;
    }
    
    console.log('\n📋 Latest A+ Request by testeur:');
    console.log(`Request ID: ${recentAPlusRequest._id}`);
    console.log(`Blood Type: ${recentAPlusRequest.patientInfo.bloodType}`);
    console.log(`Urgency: ${recentAPlusRequest.urgencyLevel}`);
    console.log(`Created: ${recentAPlusRequest.createdAt}`);
    console.log(`Requester: ${recentAPlusRequest.requesterId}`);
    
    // Simulate the exact notification logic from the API
    console.log('\n🔍 Simulating notification logic...');
    
    // Step 1: Check if Mohamed would be found as a donor
    const allDonors = await usersCollection.find({
      'medicalInfo.isDonor': true,
      'medicalInfo.availableForDonation': true
    }, {
      projection: {
        _id: 1,
        name: 1,
        phoneNumber: 1,
        bloodType: 1,
        medicalInfo: 1,
        notificationPreferences: 1
      }
    }).toArray();
    
    console.log(`Total donors found: ${allDonors.length}`);
    
    const mohamedAsDonor = allDonors.find(donor => donor._id.toString() === mohamed._id.toString());
    
    if (!mohamedAsDonor) {
      console.log('❌ Mohamed not found in donors query');
      console.log('Checking why...');
      
      console.log(`Mohamed isDonor: ${mohamed.medicalInfo?.isDonor}`);
      console.log(`Mohamed availableForDonation: ${mohamed.medicalInfo?.availableForDonation}`);
      
      if (!mohamed.medicalInfo?.isDonor) {
        console.log('🔧 Issue: Mohamed is not marked as a donor');
      }
      if (!mohamed.medicalInfo?.availableForDonation) {
        console.log('🔧 Issue: Mohamed is not available for donation');
      }
      return;
    }
    
    console.log('✅ Mohamed found in donors list');
    
    // Step 2: Check blood type compatibility
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
    
    const isCompatible = canDonateToPatient(mohamed.bloodType, recentAPlusRequest.patientInfo.bloodType);
    console.log(`Blood compatibility (${mohamed.bloodType} → ${recentAPlusRequest.patientInfo.bloodType}): ${isCompatible ? '✅' : '❌'}`);
    
    if (!isCompatible) {
      console.log('❌ Blood type incompatibility issue');
      return;
    }
    
    // Step 3: Check eligibility (same logic as API)
    function checkDonationEligibility(user, bloodRequest, maxDistance = 50) {
      const reasons = [];
      let isEligible = true;
      
      // Check blood type
      const bloodTypeMatch = canDonateToPatient(user.bloodType, bloodRequest.patientInfo.bloodType);
      if (!bloodTypeMatch) {
        reasons.push(`Blood type ${user.bloodType} not compatible with ${bloodRequest.patientInfo.bloodType}`);
        isEligible = false;
      }
      
      // Check availability
      const availabilityMatch = user.medicalInfo?.availableForDonation !== false;
      if (!availabilityMatch) {
        reasons.push('Marked as unavailable for donation');
        isEligible = false;
      }
      
      // Check if already responded
      const alreadyResponded = bloodRequest.matchedDonors?.some(
        (donor) => donor.donorId === user._id.toString()
      );
      if (alreadyResponded) {
        reasons.push('Already responded to this request');
        isEligible = false;
      }
      
      // Check if it's user's own request
      if (bloodRequest.requesterId === user._id.toString()) {
        reasons.push('This is your own blood request');
        isEligible = false;
      }
      
      return { isEligible, reasons, bloodTypeMatch, availabilityMatch };
    }
    
    const eligibility = checkDonationEligibility(mohamedAsDonor, recentAPlusRequest);
    console.log(`Eligibility check: ${eligibility.isEligible ? '✅' : '❌'}`);
    
    if (!eligibility.isEligible) {
      console.log('❌ Eligibility issues:');
      eligibility.reasons.forEach(reason => {
        console.log(`   - ${reason}`);
      });
      return;
    }
    
    // Step 4: Check notification preferences
    function shouldNotifyUser(user, bloodRequest) {
      const preferences = user.notificationPreferences || {
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
    
    const notifyPrefs = shouldNotifyUser(mohamedAsDonor, recentAPlusRequest);
    console.log(`Notification preferences:`);
    console.log(`   SMS: ${notifyPrefs.sms ? '✅' : '❌'}`);
    console.log(`   Push: ${notifyPrefs.push ? '✅' : '❌'}`);
    console.log(`   In-App: ${notifyPrefs.inApp ? '✅' : '❌'}`);
    
    if (!notifyPrefs.sms) {
      console.log('❌ SMS notifications disabled or urgency level mismatch');
      console.log(`   User urgency levels: [${(mohamedAsDonor.notificationPreferences?.urgencyLevels || []).join(', ')}]`);
      console.log(`   Request urgency: ${recentAPlusRequest.urgencyLevel}`);
      return;
    }
    
    console.log('✅ All checks passed - Mohamed should receive SMS notification');
    
    // Step 5: Check if notification was actually sent
    console.log('\n📱 Checking notification execution...');
    
    // This would require checking server logs or adding logging to the API
    console.log('The issue might be:');
    console.log('1. Server-side error during notification sending');
    console.log('2. Twilio delivery issue');
    console.log('3. The blood request creation might have failed before notifications');
    
    // Let's check the server logs approach
    console.log('\n🔧 Debugging steps:');
    console.log('1. Check Next.js server console for notification logs');
    console.log('2. Look for "📢 Sending notifications to eligible donors..." message');
    console.log('3. Check for any errors in the notification batch processing');
    
    // Test notification directly
    console.log('\n🧪 Testing direct SMS to Mohamed...');
    
    try {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const testMessage = `🚨 URGENT BloodConnect: A+ blood needed for ${recentAPlusRequest.patientInfo.name} at ${recentAPlusRequest.hospital.name}. Can you help? Open app to respond.`;
      
      const result = await twilio.messages.create({
        body: testMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: mohamed.phoneNumber
      });
      
      console.log('✅ Direct SMS sent successfully!');
      console.log(`Message SID: ${result.sid}`);
      console.log('📱 Check Mohamed\'s phone now');
      
    } catch (error) {
      console.error('❌ Direct SMS failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugAPlusRequest();