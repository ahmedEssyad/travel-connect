const axios = require('axios');

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
      medicalConditions: []
    },
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
      medicalConditions: []
    },
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
    emergencyContacts: [{
      name: 'Ibrahim Mint Mohamed',
      phone: '+22244444445',
      relationship: 'Brother'
    }]
  }
];

const createAccountViaAPI = async (account) => {
  try {
    // Step 1: Send SMS code (this will create the user)
    console.log(`Creating account for ${account.name}...`);
    
    const smsResponse = await axios.post('http://localhost:3000/api/auth/send-code', {
      phoneNumber: account.phoneNumber
    });
    
    if (!smsResponse.data.success) {
      throw new Error('Failed to send SMS code');
    }
    
    console.log(`SMS sent for ${account.phoneNumber}`);
    
    // Step 2: Verify with development code
    const verifyResponse = await axios.post('http://localhost:3000/api/auth/verify-code', {
      phoneNumber: account.phoneNumber,
      code: '123456' // Development fallback code
    });
    
    if (!verifyResponse.data.success) {
      throw new Error('Failed to verify code');
    }
    
    const { token } = verifyResponse.data;
    console.log(`User verified for ${account.phoneNumber}`);
    
    // Step 3: Set password
    const passwordResponse = await axios.post('http://localhost:3000/api/auth/set-password', {
      password: account.password
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!passwordResponse.data.success) {
      throw new Error('Failed to set password');
    }
    
    console.log(`Password set for ${account.phoneNumber}`);
    
    // Step 4: Update profile
    const profileData = {
      name: account.name,
      email: account.email,
      bloodType: account.bloodType,
      bio: account.bio,
      medicalInfo: account.medicalInfo,
      emergencyContacts: account.emergencyContacts
    };
    
    const profileResponse = await axios.put('http://localhost:3000/api/auth/profile', profileData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!profileResponse.data.success) {
      throw new Error('Failed to update profile');
    }
    
    console.log(`✅ Account created successfully for ${account.name}`);
    console.log(`   Phone: ${account.phoneNumber}`);
    console.log(`   Blood Type: ${account.bloodType}`);
    console.log(`   Password: ${account.password}`);
    console.log('');
    
  } catch (error) {
    console.error(`❌ Failed to create account for ${account.name}:`, error.message);
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
  }
};

const createAllAccounts = async () => {
  console.log('🩸 Creating BloodConnect Test Accounts');
  console.log('=====================================\n');
  
  for (const account of testAccounts) {
    await createAccountViaAPI(account);
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('=== TEST ACCOUNT SUMMARY ===');
  console.log('All accounts use password: test123');
  console.log('Phone numbers:');
  testAccounts.forEach(acc => {
    console.log(`${acc.name}: ${acc.phoneNumber} (${acc.bloodType})`);
  });
  
  console.log('\n🎉 Test accounts creation completed!');
  console.log('You can now login with any of these accounts using their phone number and password: test123');
};

// Check if server is running
const checkServer = async () => {
  try {
    await axios.get('http://localhost:3000/api/auth/check-user?phoneNumber=%2B22200000000');
    return true;
  } catch (error) {
    return false;
  }
};

const main = async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Server is not running on localhost:3000');
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  }
  
  await createAllAccounts();
};

main();