const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testInAppNotifications() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const notificationsCollection = db.collection('notifications');
    
    console.log('📱 Testing in-app notification system...\n');
    
    // Get Mohamed's user ID
    const mohamed = await usersCollection.findOne({ phoneNumber: '+22242548647' });
    
    if (!mohamed) {
      console.log('❌ Mohamed account not found');
      return;
    }
    
    console.log(`👤 Found Mohamed: ${mohamed._id}`);
    
    // Create a test in-app notification
    const testNotification = {
      userId: mohamed._id.toString(),
      type: 'blood_request',
      title: '🩸 A+ Blood Needed - TEST',
      message: 'Test Patient needs A+ blood at Test Hospital. This is a test notification to verify the in-app system is working.',
      data: {
        requestId: 'test-request-123',
        bloodType: 'A+',
        hospital: 'Test Hospital',
        urgency: 'critical',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      urgent: true,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await notificationsCollection.insertOne(testNotification);
    console.log(`✅ Test notification created: ${result.insertedId}`);
    
    // Check all notifications for Mohamed
    const allNotifications = await notificationsCollection.find({
      userId: mohamed._id.toString()
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n📋 Mohamed has ${allNotifications.length} total notifications:`);
    
    allNotifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.title}`);
      console.log(`   Type: ${notification.type}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Urgent: ${notification.urgent ? 'YES' : 'NO'}`);
      console.log(`   Read: ${notification.read ? 'YES' : 'NO'}`);
      console.log(`   Created: ${notification.createdAt}`);
      console.log('');
    });
    
    const unreadCount = allNotifications.filter(n => !n.read).length;
    console.log(`🔔 Unread notifications: ${unreadCount}`);
    
    console.log('\n✅ In-app notification system test complete!');
    console.log('\n📱 Instructions to test:');
    console.log('1. Login as Mohamed (+22242548647)');
    console.log('2. Look for the notification bell (🔔) at the top right');
    console.log('3. Click the bell to see the notification dropdown');
    console.log('4. You should see the test notification');
    console.log('5. Create a blood request with testeur to see real notifications');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testInAppNotifications();