const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Use the existing connectDB and User model
const connectDB = require('../src/lib/mongodb.ts').default;
const User = require('../src/models/User.ts').default;

// Test accounts data
const testAccounts = [
  {
    phoneNumber: '+22211111111',
    name: 'Ahmed Mohamed',
    email: 'ahmed@test.com',
    bloodType: 'O+',
    password: 'test123',
    bio: 'Regular blood donor, available for emergencies',
    medicalInfo: {
      weight: 75,
      age: 28,
      availableForDonation: true,
      isDonor: true,
      lastDonationDate: new Date('2024-10-15'),
      medicalConditions: []
    },
    totalDonations: 5,
    emergencyContacts: [{
      name: 'Fatima Mohamed',
      phone: '+22211111112',
      relationship: 'Sister'
    }]
  },
  {
    phoneNumber: '+22222222222',
    name: 'Fatima Al-Hassan',
    email: 'fatima@test.com',
    bloodType: 'A+',
    password: 'test123',
    bio: 'Healthcare worker, happy to help save lives',
    medicalInfo: {
      weight: 65,
      age: 32,
      availableForDonation: true,
      isDonor: true,
      lastDonationDate: new Date('2024-11-20'),
      medicalConditions: []
    },
    totalDonations: 8,
    emergencyContacts: [{
      name: 'Omar Al-Hassan',
      phone: '+22222222223',
      relationship: 'Husband'
    }]
  },
  {
    phoneNumber: '+22233333333',
    name: 'Mohamed Ould Ahmed',
    email: 'mohamed@test.com',
    bloodType: 'B-',
    password: 'test123',
    bio: 'University student, first-time donor',
    medicalInfo: {
      weight: 70,
      age: 22,
      availableForDonation: true,
      isDonor: true,
      medicalConditions: []
    },
    totalDonations: 1,
    emergencyContacts: [{
      name: 'Aisha Ould Ahmed',
      phone: '+22233333334',
      relationship: 'Mother'
    }]
  },
  {
    phoneNumber: '+22244444444',
    name: 'Aisha Mint Mohamed',
    email: 'aisha@test.com',
    bloodType: 'AB+',
    password: 'test123',
    bio: 'Looking for blood donors for family member',
    medicalInfo: {
      weight: 58,
      age: 35,
      availableForDonation: false,
      isDonor: false,
      medicalConditions: ['Anemia']
    },
    totalDonations: 0,
    emergencyContacts: [{
      name: 'Ibrahim Mint Mohamed',
      phone: '+22244444445',
      relationship: 'Brother'
    }]
  }
];

const createTestAccounts = async () => {
  try {
    await connectDB();
    
    console.log('Creating test accounts...\n');
    
    // Clear existing test accounts
    await User.deleteMany({ phoneNumber: { $in: testAccounts.map(acc => acc.phoneNumber) } });
    console.log('Cleared existing test accounts');
    
    for (const accountData of testAccounts) {
      try {
        // Hash password
        const hashedPassword = bcrypt.hashSync(accountData.password, 12);
        
        // Create user
        const user = new User({
          ...accountData,
          password: hashedPassword,
          hasPassword: true,
          isVerified: true
        });
        
        await user.save();
        
        console.log(`✅ Created account: ${accountData.name} (${accountData.phoneNumber})`);
        console.log(`   Blood Type: ${accountData.bloodType}`);
        console.log(`   Password: ${accountData.password}`);
        console.log(`   Donor: ${accountData.medicalInfo.isDonor ? 'Yes' : 'No'}`);
        console.log(`   Available: ${accountData.medicalInfo.availableForDonation ? 'Yes' : 'No'}`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ Failed to create account ${accountData.name}:`, error.message);
      }
    }
    
    console.log('Test accounts creation completed!');
    console.log('\n=== TEST ACCOUNT SUMMARY ===');
    console.log('All accounts use password: test123');
    console.log('Phone numbers:');
    testAccounts.forEach(acc => {
      console.log(`${acc.name}: ${acc.phoneNumber} (${acc.bloodType})`);
    });
    
  } catch (error) {
    console.error('Error creating test accounts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the script
createTestAccounts();