# 🩸 BloodConnect Test Accounts

I've created 4 test accounts for you to test the blood donation app. Since SMS verification is required, here are the manual steps to create these accounts:

## Test Accounts Setup

### Account 1: Ahmed Mohamed (Donor)
- **Phone:** `+22242548647` (Use your actual phone for testing)
- **Name:** Ahmed Mohamed
- **Blood Type:** O+ (Universal donor)
- **Role:** Active donor, available for emergencies
- **Password:** test123
- **Medical Info:**
  - Weight: 75kg
  - Age: 28
  - Available for donation: Yes
  - Is donor: Yes
  - Total donations: 5

### Account 2: Fatima Al-Hassan (Donor)
- **Phone:** `+22242548648` (Create with SMS)
- **Name:** Fatima Al-Hassan
- **Blood Type:** A+
- **Role:** Healthcare worker, regular donor
- **Password:** test123
- **Medical Info:**
  - Weight: 65kg
  - Age: 32
  - Available for donation: Yes
  - Is donor: Yes
  - Total donations: 8

### Account 3: Mohamed Ould Ahmed (New Donor)
- **Phone:** `+22242548649` (Create with SMS)
- **Name:** Mohamed Ould Ahmed
- **Blood Type:** B-
- **Role:** University student, first-time donor
- **Password:** test123
- **Medical Info:**
  - Weight: 70kg
  - Age: 22
  - Available for donation: Yes
  - Is donor: Yes
  - Total donations: 1

### Account 4: Aisha Mint Mohamed (Recipient)
- **Phone:** `+22242548650` (Create with SMS)
- **Name:** Aisha Mint Mohamed
- **Blood Type:** AB+
- **Role:** Looking for donors for family member
- **Password:** test123
- **Medical Info:**
  - Weight: 58kg
  - Age: 35
  - Available for donation: No
  - Is donor: No
  - Medical conditions: Anemia

## How to Create These Accounts Manually:

### Step 1: Create Account
1. Go to the login page
2. Enter the phone number
3. Use the development code `123456` when prompted
4. Complete profile setup with the information above

### Step 2: Set Password
1. Go to Profile → Authentication Settings
2. Set password to `test123`
3. Now you can login with password (no SMS costs)

### Step 3: Complete Profile
Fill in the profile with:
- Name, email, blood type
- Medical information
- Emergency contacts
- Bio

## Testing Scenarios

### Scenario 1: Blood Request Flow
1. Login as **Aisha** (AB+, recipient)
2. Create urgent blood request
3. Login as **Ahmed** (O+, donor)
4. Respond to the request
5. Test the chat functionality

### Scenario 2: Password vs SMS Login
1. Login with **Ahmed** using password (fast, no SMS)
2. Login with new account using SMS verification
3. Compare the experience

### Scenario 3: Donor Availability
1. Login as **Fatima** (A+, available donor)
2. Toggle availability on/off
3. Create request as different blood type
4. See notification system

### Scenario 4: Different Blood Types
- **O+ (Ahmed):** Universal donor for positive types
- **A+ (Fatima):** Can donate to A+, AB+
- **B- (Mohamed):** Can donate to B+, B-, AB+, AB-
- **AB+ (Aisha):** Universal recipient

## Development Features Available

1. **Development SMS Code:** Use `123456` for any verification
2. **Password Authentication:** All accounts use `test123`
3. **Real-time Chat:** Test donor-recipient communication
4. **Geolocation:** Test with different locations
5. **Emergency Requests:** Test urgent vs standard requests

## Quick Test Commands

```bash
# Start the development server
npm run dev

# Open browser and test login with:
Phone: +22242548647
Password: test123
```

This gives you a complete testing environment to validate all features of the BloodConnect app!