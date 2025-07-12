const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function debugNotifications() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const bloodRequestsCollection = db.collection('bloodrequests');
    
    console.log('🕵️ Debugging notification system...\n');
    
    // Check recent blood requests
    console.log('1️⃣ Recent blood requests:');
    const recentRequests = await bloodRequestsCollection.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();
    
    if (recentRequests.length === 0) {
      console.log('❌ No blood requests found in database');
      return;
    }
    
    recentRequests.forEach((request, index) => {
      console.log(`📋 Request ${index + 1}:`);
      console.log(`   ID: ${request._id}`);
      console.log(`   Blood Type: ${request.patientInfo?.bloodType}`);
      console.log(`   Urgency: ${request.urgencyLevel}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Created: ${request.createdAt}`);
      console.log(`   Requester: ${request.requesterId}`);
      console.log('');
    });
    
    // Check the most recent request in detail
    const latestRequest = recentRequests[0];
    console.log(`2️⃣ Analyzing latest request (${latestRequest.patientInfo?.bloodType}):`);
    
    // Get all donors
    const allDonors = await usersCollection.find({
      'medicalInfo.isDonor': true,
      'medicalInfo.availableForDonation': true
    }, {
      projection: {
        name: 1,
        phoneNumber: 1,
        bloodType: 1,
        medicalInfo: 1,
        notificationPreferences: 1
      }
    }).toArray();
    
    console.log(`📊 Total donors: ${allDonors.length}`);
    
    // Check blood type compatibility
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
      return donor.bloodType && canDonateToPatient(donor.bloodType, latestRequest.patientInfo?.bloodType);
    });
    
    console.log(`🩸 Compatible donors: ${compatibleDonors.length}`);
    compatibleDonors.forEach(donor => {
      console.log(`   ✓ ${donor.name} (${donor.bloodType}) - ${donor.phoneNumber}`);
    });
    
    // Check notification preferences
    console.log('\n3️⃣ Notification preferences check:');
    compatibleDonors.forEach(donor => {
      const prefs = donor.notificationPreferences || {};
      const shouldNotify = (prefs.urgencyLevels || []).includes(latestRequest.urgencyLevel);
      
      console.log(`👤 ${donor.name}:`);
      console.log(`   SMS enabled: ${prefs.sms ? '✅' : '❌'}`);
      console.log(`   Urgency levels: [${(prefs.urgencyLevels || []).join(', ')}]`);
      console.log(`   Should notify for ${latestRequest.urgencyLevel}: ${shouldNotify && prefs.sms ? '✅' : '❌'}`);
      console.log('');
    });
    
    // Check if you are in the donors list
    console.log('4️⃣ Checking if you are a donor:');
    const yourPhoneNumbers = ['+22242548647', '+22248334893']; // Add your phone numbers
    
    const yourDonorAccounts = allDonors.filter(donor => 
      yourPhoneNumbers.includes(donor.phoneNumber)
    );
    
    if (yourDonorAccounts.length > 0) {
      console.log('✅ Found your donor accounts:');
      yourDonorAccounts.forEach(donor => {
        const prefs = donor.notificationPreferences || {};
        const compatible = canDonateToPatient(donor.bloodType, latestRequest.patientInfo?.bloodType);
        const shouldNotify = (prefs.urgencyLevels || []).includes(latestRequest.urgencyLevel);
        
        console.log(`👤 ${donor.name} (${donor.phoneNumber}):`);
        console.log(`   Blood type: ${donor.bloodType}`);
        console.log(`   Compatible with ${latestRequest.patientInfo?.bloodType}: ${compatible ? '✅' : '❌'}`);
        console.log(`   SMS enabled: ${prefs.sms ? '✅' : '❌'}`);
        console.log(`   Urgency match: ${shouldNotify ? '✅' : '❌'}`);
        console.log(`   Available for donation: ${donor.medicalInfo?.availableForDonation ? '✅' : '❌'}`);
        console.log(`   Should receive notification: ${compatible && prefs.sms && shouldNotify && donor.medicalInfo?.availableForDonation ? '✅' : '❌'}`);
        console.log('');
      });
    } else {
      console.log('❌ No donor accounts found for your phone numbers');
      console.log('💡 Make sure you:');
      console.log('   1. Set yourself as a donor in profile settings');
      console.log('   2. Mark yourself as available for donation');
      console.log('   3. Have a compatible blood type');
    }
    
    // Check SMS service configuration
    console.log('5️⃣ SMS Service configuration:');
    const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    console.log(`Twilio configured: ${twilioConfigured ? '✅' : '❌ (Development mode)'}`);
    console.log(`Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
    console.log(`Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`Phone Number: ${process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing'}`);
    
    if (!twilioConfigured) {
      console.log('\n💡 In development mode, SMS logs should appear in server console');
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Error debugging notifications:', error);
  } finally {
    await client.close();
  }
}

debugNotifications();