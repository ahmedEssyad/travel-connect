# Blood Request Matching App - Implementation Plan

## 1. Database Schema Changes

### User Schema (Updated)
```javascript
{
  uid: String,
  email: String,
  name: String,
  phone: String, // Required for SMS
  bloodType: String, // A+, A-, B+, B-, AB+, AB-, O+, O-
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  medicalInfo: {
    weight: Number,
    age: Number,
    lastDonationDate: Date,
    medicalConditions: [String],
    availableForDonation: Boolean
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  notificationPreferences: {
    sms: Boolean,
    push: Boolean,
    email: Boolean,
    urgencyLevels: [String] // ['critical', 'urgent', 'standard']
  },
  deviceTokens: [String], // For push notifications
  isVerified: Boolean, // Medical verification status
  rating: Number,
  totalDonations: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Blood Request Schema (Replaces Trips)
```javascript
{
  requesterId: String,
  patientInfo: {
    name: String,
    age: Number,
    bloodType: String,
    condition: String
  },
  hospital: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    contactNumber: String
  },
  urgencyLevel: String, // 'critical', 'urgent', 'standard'
  requiredUnits: Number,
  deadline: Date,
  description: String,
  status: String, // 'active', 'fulfilled', 'expired', 'cancelled'
  matchedDonors: [{
    donorId: String,
    status: String, // 'pending', 'accepted', 'completed'
    respondedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 2. Blood Type Compatibility Matrix

```javascript
const bloodCompatibility = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal receiver
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'] // Universal donor
};
```

## 3. Notification Services

### A. Push Notifications (Firebase FCM)
```javascript
// Send to all compatible donors in radius
async function sendUrgentNotification(bloodRequest) {
  const compatibleDonors = await findCompatibleDonors(bloodRequest);
  
  const message = {
    notification: {
      title: `${bloodRequest.urgencyLevel.toUpperCase()} Blood Request`,
      body: `${bloodRequest.patientInfo.bloodType} needed at ${bloodRequest.hospital.name}`,
      icon: '/icons/blood-drop.png',
      badge: '/icons/badge.png'
    },
    data: {
      requestId: bloodRequest._id,
      urgency: bloodRequest.urgencyLevel,
      bloodType: bloodRequest.patientInfo.bloodType,
      hospital: bloodRequest.hospital.name
    }
  };

  // Send to all compatible donors
  await admin.messaging().sendMulticast({
    tokens: compatibleDonors.map(donor => donor.deviceTokens).flat(),
    ...message
  });
}
```

### B. SMS Notifications (Twilio)
```javascript
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

async function sendSMSAlert(donor, bloodRequest) {
  const message = `🩸 URGENT: ${bloodRequest.patientInfo.bloodType} blood needed at ${bloodRequest.hospital.name}. ${bloodRequest.patientInfo.condition}. Reply YES to help. View details: ${process.env.APP_URL}/request/${bloodRequest._id}`;
  
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: donor.phone
  });
}
```

## 4. Matching Algorithm

```javascript
async function findCompatibleDonors(bloodRequest) {
  const { patientInfo, hospital, urgencyLevel } = bloodRequest;
  const compatibleTypes = bloodCompatibility[patientInfo.bloodType];
  
  // Find donors within radius (5km for critical, 10km for urgent, 20km for standard)
  const radiusKm = urgencyLevel === 'critical' ? 5 : urgencyLevel === 'urgent' ? 10 : 20;
  
  const donors = await User.find({
    bloodType: { $in: compatibleTypes },
    'medicalInfo.availableForDonation': true,
    'medicalInfo.lastDonationDate': { 
      $lt: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) // 56 days ago
    },
    'notificationPreferences.urgencyLevels': urgencyLevel,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [hospital.coordinates.lng, hospital.coordinates.lat]
        },
        $maxDistance: radiusKm * 1000 // Convert to meters
      }
    }
  });

  return donors;
}
```

## 5. Real-time Features

### WebSocket Events
```javascript
// When urgent request is created
socket.broadcast.emit('urgent-blood-request', {
  requestId: bloodRequest._id,
  bloodType: bloodRequest.patientInfo.bloodType,
  urgency: bloodRequest.urgencyLevel,
  hospital: bloodRequest.hospital.name,
  location: bloodRequest.hospital.coordinates
});

// When donor responds
socket.to(requesterId).emit('donor-response', {
  donorId: donor._id,
  donorName: donor.name,
  response: 'accepted' // or 'declined'
});
```

## 6. UI Components to Create

1. **Blood Type Selector**
2. **Medical Info Form**
3. **Emergency Request Button**
4. **Donor Response Interface**
5. **Hospital/Clinic Selector**
6. **Urgency Level Indicator**
7. **Real-time Request Map**
8. **Notification Settings**

## 7. Integration Services

### Required APIs/Services:
- **Firebase Cloud Messaging** (Push notifications)
- **Twilio** (SMS notifications)
- **Google Maps API** (Location services)
- **SendGrid** (Email notifications)
- **MongoDB GeoSpatial** (Location-based queries)

## 8. Legal & Compliance

- **Medical Data Privacy** (HIPAA compliance)
- **User Verification** (Medical screening)
- **Terms of Service** (Medical disclaimer)
- **Data Protection** (GDPR compliance)

## 9. Key Features to Implement

1. **Donor Verification System**
2. **Hospital Partnership Integration**
3. **Blood Bank Integration**
4. **Medical Emergency Response**
5. **Donation History Tracking**
6. **Health Screening Questionnaire**
7. **Appointment Scheduling**
8. **Real-time Tracking**

Would you like me to start implementing any specific part of this system?