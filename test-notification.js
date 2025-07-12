const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function createTestDonors() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Create test donors with different blood types
    const testDonors = [
      {
        phoneNumber: '+1234567890',
        name: 'John Universal Donor',
        bloodType: 'O-',
        medicalInfo: {
          isDonor: true,
          availableForDonation: true,
          lastDonationDate: new Date('2023-01-01') // Old enough to donate again
        },
        notificationPreferences: {
          sms: true,
          push: true,
          email: true,
          urgencyLevels: ['critical', 'urgent', 'standard']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phoneNumber: '+1234567891',
        name: 'Sarah A+ Donor',
        bloodType: 'A+',
        medicalInfo: {
          isDonor: true,
          availableForDonation: true,
          lastDonationDate: new Date('2023-01-01')
        },
        notificationPreferences: {
          sms: true,
          push: true,
          email: true,
          urgencyLevels: ['critical', 'urgent', 'standard']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phoneNumber: '+1234567892',
        name: 'Mike B+ Donor',
        bloodType: 'B+',
        medicalInfo: {
          isDonor: true,
          availableForDonation: true,
          lastDonationDate: new Date('2023-01-01')
        },
        notificationPreferences: {
          sms: true,
          push: true,
          email: true,
          urgencyLevels: ['critical', 'urgent', 'standard']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert test donors
    for (const donor of testDonors) {
      try {
        await usersCollection.updateOne(
          { phoneNumber: donor.phoneNumber },
          { $set: donor },
          { upsert: true }
        );
        console.log(`✅ Created/updated donor: ${donor.name} (${donor.bloodType})`);
      } catch (error) {
        console.log(`⚠️  Donor ${donor.name} might already exist:`, error.message);
      }
    }
    
    console.log('🩸 Test donors created successfully!');
    
  } catch (error) {
    console.error('Error creating test donors:', error);
  } finally {
    await client.close();
  }
}

createTestDonors();