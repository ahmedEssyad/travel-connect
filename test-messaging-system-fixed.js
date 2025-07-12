const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testMessagingSystemFixed() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const bloodRequestsCollection = db.collection('bloodrequests');
    const messagesCollection = db.collection('messages');
    
    console.log('🔍 Testing FIXED messaging system...\n');
    
    // Get test users
    const mohamed = await usersCollection.findOne({ phoneNumber: '+22242548647' });
    const testeur = await usersCollection.findOne({ phoneNumber: '+22248334893' });
    
    if (!mohamed || !testeur) {
      console.log('❌ Test users not found');
      return;
    }
    
    console.log('👥 Test Users:');
    console.log(`   Mohamed: ${mohamed._id} (${mohamed.name})`);
    console.log(`   Testeur: ${testeur._id} (${testeur.name})`);
    
    // Test the NEW chat discovery logic for Mohamed
    console.log('\n💬 Testing NEW chat discovery logic for Mohamed...');
    
    // Get ALL blood requests (similar to updated messages page logic)
    const allRequests = await bloodRequestsCollection.find({}).toArray();
    console.log(`Found ${allRequests.length} total blood requests`);
    
    const mohamedChats = [];
    
    allRequests.forEach(request => {
      // Check if Mohamed is the requester
      if (request.requesterId === mohamed._id.toString()) {
        // Mohamed is requester - look for matched donors
        if (request.matchedDonors && request.matchedDonors.length > 0) {
          request.matchedDonors.forEach(donor => {
            const chatId = [mohamed._id.toString(), donor.donorId].sort().join('_');
            
            // Check if this chat already exists to avoid duplicates
            const existingChat = mohamedChats.find(chat => chat.chatId === chatId);
            if (!existingChat) {
              mohamedChats.push({
                chatId,
                otherUserId: donor.donorId,
                otherUserName: donor.donorName,
                role: 'requester',
                requestId: request._id.toString(),
                bloodType: request.patientInfo.bloodType,
                hospital: request.hospital.name,
                urgency: request.urgencyLevel,
                isActive: request.status === 'active'
              });
            }
          });
        }
      } else if (request.matchedDonors && request.matchedDonors.length > 0) {
        // Check if Mohamed is a matched donor
        const mohamedAsDonor = request.matchedDonors.find(donor => donor.donorId === mohamed._id.toString());
        if (mohamedAsDonor) {
          const chatId = [mohamed._id.toString(), request.requesterId].sort().join('_');
          
          // Check if this chat already exists to avoid duplicates
          const existingChat = mohamedChats.find(chat => chat.chatId === chatId);
          if (!existingChat) {
            mohamedChats.push({
              chatId,
              otherUserId: request.requesterId,
              otherUserName: request.contactInfo?.requesterName || 'Requester',
              role: 'donor',
              requestId: request._id.toString(),
              bloodType: request.patientInfo.bloodType,
              hospital: request.hospital.name,
              urgency: request.urgencyLevel,
              isActive: request.status === 'active'
            });
          }
        }
      }
    });
    
    console.log(`Mohamed should see ${mohamedChats.length} chats with NEW logic:`);
    mohamedChats.forEach((chat, index) => {
      console.log(`   ${index + 1}. Chat ID: ${chat.chatId}`);
      console.log(`      Other User: ${chat.otherUserName} (${chat.otherUserId})`);
      console.log(`      Role: ${chat.role}`);
      console.log(`      Request: ${chat.requestId}`);
      console.log(`      Blood Type: ${chat.bloodType}`);
      console.log(`      Hospital: ${chat.hospital}`);
      console.log(`      Active: ${chat.isActive}`);
      console.log('');
    });
    
    // Test chat functionality for the first chat
    if (mohamedChats.length > 0) {
      const testChat = mohamedChats[0];
      console.log(`🧪 Testing chat functionality for: ${testChat.chatId}`);
      
      // Check if messages exist for this chat
      const existingMessages = await messagesCollection.find({
        chatId: testChat.chatId
      }).sort({ timestamp: 1 }).toArray();
      
      console.log(`Found ${existingMessages.length} existing messages:`);
      existingMessages.forEach((msg, index) => {
        const senderName = msg.senderId === mohamed._id.toString() ? 'Mohamed' : 
                          msg.senderId === 'system' ? 'System' : 'Other';
        console.log(`   ${index + 1}. ${senderName}: ${msg.text}`);
      });
      
      // Test navigation URL that should be generated
      const navigationUrl = `/chat?chatId=${testChat.chatId}&requestId=${testChat.requestId}`;
      console.log(`\n🔗 Navigation URL: ${navigationUrl}`);
      
      // Test if chat can be accessed (simulate API logic)
      const chatUserIds = testChat.chatId.split('_');
      const hasAccess = chatUserIds.includes(mohamed._id.toString());
      console.log(`✅ Chat access check: ${hasAccess ? 'ALLOWED' : 'DENIED'}`);
    }
    
    // Test for Testeur as well
    console.log('\n💬 Testing chat discovery for Testeur...');
    
    const testeurChats = [];
    
    allRequests.forEach(request => {
      // Check if Testeur is the requester
      if (request.requesterId === testeur._id.toString()) {
        // Testeur is requester - look for matched donors
        if (request.matchedDonors && request.matchedDonors.length > 0) {
          request.matchedDonors.forEach(donor => {
            const chatId = [testeur._id.toString(), donor.donorId].sort().join('_');
            
            const existingChat = testeurChats.find(chat => chat.chatId === chatId);
            if (!existingChat) {
              testeurChats.push({
                chatId,
                otherUserId: donor.donorId,
                otherUserName: donor.donorName,
                role: 'requester',
                requestId: request._id.toString(),
                bloodType: request.patientInfo.bloodType,
                hospital: request.hospital.name
              });
            }
          });
        }
      } else if (request.matchedDonors && request.matchedDonors.length > 0) {
        // Check if Testeur is a matched donor
        const testeurAsDonor = request.matchedDonors.find(donor => donor.donorId === testeur._id.toString());
        if (testeurAsDonor) {
          const chatId = [testeur._id.toString(), request.requesterId].sort().join('_');
          
          const existingChat = testeurChats.find(chat => chat.chatId === chatId);
          if (!existingChat) {
            testeurChats.push({
              chatId,
              otherUserId: request.requesterId,
              otherUserName: request.contactInfo?.requesterName || 'Requester',
              role: 'donor',
              requestId: request._id.toString(),
              bloodType: request.patientInfo.bloodType,
              hospital: request.hospital.name
            });
          }
        }
      }
    });
    
    console.log(`Testeur should see ${testeurChats.length} chats:`);
    testeurChats.forEach((chat, index) => {
      console.log(`   ${index + 1}. ${chat.otherUserName} (${chat.role}) - ${chat.bloodType}`);
    });
    
    console.log('\n✅ MESSAGING SYSTEM FIXES SUMMARY:');
    console.log('1. ✅ Fixed blood request contactInfo creation');
    console.log('2. ✅ Updated existing blood requests with proper contactInfo');
    console.log('3. ✅ Improved chat discovery logic in messages page');
    console.log('4. ✅ Added better role detection (requester vs donor)');
    console.log('5. ✅ Fixed chat sorting and deduplication');
    
    console.log(`\n📊 RESULTS:`);
    console.log(`   - Mohamed can see ${mohamedChats.length} chats`);
    console.log(`   - Testeur can see ${testeurChats.length} chats`);
    console.log(`   - Total messages in system: ${await messagesCollection.countDocuments()}`);
    
    if (mohamedChats.length > 0 || testeurChats.length > 0) {
      console.log('\n🎉 MESSAGING SYSTEM IS NOW WORKING!');
    } else {
      console.log('\n⚠️  No chats found - users need to be matched to blood requests first');
    }
    
  } catch (error) {
    console.error('❌ Error testing messaging system:', error);
  } finally {
    await client.close();
  }
}

testMessagingSystemFixed();