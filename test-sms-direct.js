const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testSMSDirectly() {
  console.log('📱 Testing SMS notification directly...\n');
  
  // Test Twilio configuration
  console.log('1️⃣ Twilio Configuration:');
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  console.log(`Account SID: ${accountSid ? accountSid.substring(0, 10) + '...' : 'Missing'}`);
  console.log(`Auth Token: ${authToken ? '***Set***' : 'Missing'}`);
  console.log(`From Number: ${fromNumber || 'Missing'}`);
  
  if (!accountSid || !authToken || !fromNumber) {
    console.log('❌ Twilio not fully configured, using development mode');
  }
  
  // Test SMS sending function
  console.log('\n2️⃣ Testing SMS send function:');
  
  try {
    const twilio = require('twilio')(accountSid, authToken);
    
    // Test with your phone number
    const testPhoneNumber = '+22242548647'; // Your number
    const testMessage = 'TEST: BloodConnect notification system test. Please ignore this message.';
    
    console.log(`Sending test SMS to ${testPhoneNumber}...`);
    
    if (accountSid && authToken && fromNumber) {
      // Real SMS
      const result = await twilio.messages.create({
        body: testMessage,
        from: fromNumber,
        to: testPhoneNumber
      });
      
      console.log('✅ SMS sent successfully!');
      console.log(`Message SID: ${result.sid}`);
      console.log(`Status: ${result.status}`);
    } else {
      // Development mode
      console.log('📝 Development mode - SMS would be sent:');
      console.log(`To: ${testPhoneNumber}`);
      console.log(`From: ${fromNumber || '+222XXXXXXXX'}`);
      console.log(`Message: ${testMessage}`);
      console.log('✅ SMS logged (development mode)');
    }
    
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
  }
  
  // Test the notification API endpoint
  console.log('\n3️⃣ Testing notification API endpoint:');
  
  try {
    const fetch = require('node-fetch');
    
    const response = await fetch('http://localhost:3000/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail auth but we can see if the endpoint exists
      },
      body: JSON.stringify({
        to: '+22242548647',
        message: 'Test notification',
        urgent: true
      })
    });
    
    console.log(`API Response Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`API Response: ${responseText}`);
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('💡 This might be because the server is not running on localhost:3000');
  }
  
  // Test notification creation during blood request
  console.log('\n4️⃣ Testing notification creation process:');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Get your donor account
    const yourAccount = await usersCollection.findOne({
      phoneNumber: '+22242548647'
    });
    
    if (yourAccount) {
      console.log(`✅ Found your account: ${yourAccount.name}`);
      console.log(`Blood type: ${yourAccount.bloodType}`);
      console.log(`Is donor: ${yourAccount.medicalInfo?.isDonor}`);
      console.log(`Available: ${yourAccount.medicalInfo?.availableForDonation}`);
      console.log(`SMS enabled: ${yourAccount.notificationPreferences?.sms}`);
      
      // Simulate the blood request creation notification process
      const mockBloodRequest = {
        patientInfo: {
          name: 'Test Patient',
          bloodType: 'A+',
          condition: 'Test condition'
        },
        hospital: {
          name: 'Test Hospital',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        urgencyLevel: 'urgent',
        deadline: new Date()
      };
      
      // Test notification functions
      console.log('\n5️⃣ Testing notification functions:');
      
      // Check if notification functions work
      function checkDonationEligibility(user, bloodRequest, maxDistance = 50) {
        const reasons = [];
        let isEligible = true;
        
        // Simple blood type check
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
        
        const bloodTypeMatch = compatibility[bloodRequest.patientInfo.bloodType]?.includes(user.bloodType);
        if (!bloodTypeMatch) {
          reasons.push(`Blood type incompatible`);
          isEligible = false;
        }
        
        const availabilityMatch = user.medicalInfo?.availableForDonation !== false;
        if (!availabilityMatch) {
          reasons.push('Not available for donation');
          isEligible = false;
        }
        
        return { isEligible, reasons, bloodTypeMatch, availabilityMatch };
      }
      
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
      
      const eligibility = checkDonationEligibility(yourAccount, mockBloodRequest);
      const notifyPrefs = shouldNotifyUser(yourAccount, mockBloodRequest);
      
      console.log(`Eligibility check: ${eligibility.isEligible ? '✅' : '❌'}`);
      if (!eligibility.isEligible) {
        console.log(`Reasons: ${eligibility.reasons.join(', ')}`);
      }
      
      console.log(`Should notify SMS: ${notifyPrefs.sms ? '✅' : '❌'}`);
      console.log(`Should notify Push: ${notifyPrefs.push ? '✅' : '❌'}`);
      
    } else {
      console.log('❌ Could not find your donor account');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.close();
  }
  
  console.log('\n💡 Debugging suggestions:');
  console.log('1. Check the Next.js server console for notification logs');
  console.log('2. Verify you created the blood request with the correct account');
  console.log('3. Make sure you are not the requester (self-requests are filtered out)');
  console.log('4. Check if your blood type is compatible with the request');
}

testSMSDirectly();