const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function fixBloodRequestsContactInfo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const bloodRequestsCollection = db.collection('bloodrequests');
    
    console.log('🔧 Fixing blood requests contactInfo...\n');
    
    // Find blood requests without proper contactInfo
    const requestsWithoutContactInfo = await bloodRequestsCollection.find({
      $or: [
        { contactInfo: { $exists: false } },
        { 'contactInfo.requesterName': { $exists: false } },
        { 'contactInfo.requesterName': '' },
        { 'contactInfo.requesterName': null }
      ]
    }).toArray();
    
    console.log(`Found ${requestsWithoutContactInfo.length} blood requests needing contactInfo fix`);
    
    for (const request of requestsWithoutContactInfo) {
      console.log(`\nFixing request ${request._id}:`);
      console.log(`  Requester ID: ${request.requesterId}`);
      
      // Get the requester's info
      const requester = await usersCollection.findOne({ _id: request.requesterId });
      
      if (requester) {
        console.log(`  Found requester: ${requester.name} (${requester.phoneNumber})`);
        
        // Update the blood request with proper contactInfo
        const updateResult = await bloodRequestsCollection.updateOne(
          { _id: request._id },
          {
            $set: {
              'contactInfo.requesterName': requester.name || 'User',
              'contactInfo.requesterPhone': requester.phoneNumber || '',
              'contactInfo.alternateContact': request.contactInfo?.alternateContact || ''
            }
          }
        );
        
        console.log(`  ✅ Updated contactInfo (${updateResult.modifiedCount} modified)`);
      } else {
        console.log(`  ❌ Requester not found for ID: ${request.requesterId}`);
      }
    }
    
    // Verify the fix
    console.log('\n📋 Verification:');
    const fixedRequests = await bloodRequestsCollection.find({
      'contactInfo.requesterName': { $exists: true, $ne: '', $ne: null }
    }).count();
    
    const totalRequests = await bloodRequestsCollection.countDocuments();
    
    console.log(`✅ ${fixedRequests}/${totalRequests} blood requests now have proper contactInfo`);
    
    // Show sample of fixed requests
    const sampleFixed = await bloodRequestsCollection.find({
      'contactInfo.requesterName': { $exists: true, $ne: '', $ne: null }
    }).limit(3).toArray();
    
    console.log('\n📝 Sample fixed requests:');
    sampleFixed.forEach((request, index) => {
      console.log(`${index + 1}. ${request._id}:`);
      console.log(`   Requester: ${request.contactInfo.requesterName}`);
      console.log(`   Phone: ${request.contactInfo.requesterPhone}`);
      console.log(`   Blood Type: ${request.patientInfo.bloodType}`);
      console.log(`   Hospital: ${request.hospital.name}`);
    });
    
    console.log('\n✅ Blood request contactInfo fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing blood requests:', error);
  } finally {
    await client.close();
  }
}

fixBloodRequestsContactInfo();