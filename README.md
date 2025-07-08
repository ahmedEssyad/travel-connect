# TravelConnect PWA

A Progressive Web App that connects people who want to send items internationally with travelers heading in that direction.

## Features

- 🔐 **Authentication**: Firebase Auth with email/password
- 🏠 **Home Page**: Browse trips and delivery requests
- ✈️ **Post Trip**: Travelers can post their upcoming trips
- 📦 **Post Request**: Senders can post delivery requests
- 🤝 **Matching**: Smart algorithm matches trips with requests
- 👤 **User Profiles**: Complete user profiles with ratings
- 💬 **Messaging**: Basic chat system between matched users
- 🔔 **Push Notifications**: Firebase Cloud Messaging
- 📱 **PWA**: Installable with offline support

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript
- **Styling**: TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Cloud Storage, FCM)
- **PWA**: next-pwa
- **Hosting**: Vercel (recommended)

## Setup Instructions

### 1. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Storage
   - Cloud Messaging
3. Get your Firebase configuration from Project Settings
4. Update `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Database Structure

### Users Collection
```typescript
{
  uid: string;
  email: string;
  name: string;
  photo?: string;
  location?: string;
  bio?: string;
  rating: number;
  createdAt: Date;
}
```

### Trips Collection
```typescript
{
  id: string;
  userId: string;
  from: string;
  to: string;
  departureDate: Date;
  arrivalDate: Date;
  capacity: number;
  allowedItems: string[];
  description?: string;
  createdAt: Date;
}
```

### Requests Collection
```typescript
{
  id: string;
  userId: string;
  from: string;
  to: string;
  deadline: Date;
  itemType: string;
  description?: string;
  reward?: string;
  photo?: string;
  createdAt: Date;
}
```

### Matches Collection
```typescript
{
  id: string;
  tripId: string;
  requestId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: Date;
}
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Firebase Hosting (Alternative)

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

## PWA Features

- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Basic offline functionality
- **Push Notifications**: Real-time notifications for matches and messages
- **App-like Experience**: Full-screen, responsive design

## Security Features

- Firebase Authentication
- Firestore Security Rules (to be configured)
- Input validation and sanitization
- Image upload restrictions

## Future Enhancements

- Real-time location tracking
- QR code verification for item handoff
- Payment integration
- Enhanced trust system
- Multi-language support
- Advanced search and filtering
- Map integration
- Review and rating system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
