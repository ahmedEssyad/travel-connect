# WebSocket Real-time Notifications Testing

## Setup Instructions

1. **Start the WebSocket server:**
   ```bash
   npm run ws
   ```

2. **Start the Next.js app:**
   ```bash
   npm run dev
   ```

3. **Or run both together:**
   ```bash
   npm run dev:full
   ```

## Testing the Connection Flow

### Manual Testing:

1. **Create two users:**
   - User A: Register/login as first user
   - User B: Register/login as second user (use different browser/incognito)

2. **Test the flow:**
   - User A posts a trip
   - User B posts a request that matches the trip
   - User A goes to `/matches` and clicks "Connect" on User B's request
   - User B should receive a real-time notification instantly

3. **What to expect:**
   - User B gets a toast notification
   - User B gets a browser notification (if permissions granted)
   - User B sees a notification badge on the "Matches" nav item
   - User B sees the notification in the pending notifications section

### Automated Testing:

1. **Test WebSocket connection:**
   ```bash
   node test-websocket.js
   ```

## Key Features Implemented:

✅ **Real-time notifications** - Users get instant notifications when someone connects
✅ **Match creation** - API creates match records in database
✅ **WebSocket integration** - Server-side and client-side WebSocket handling
✅ **UI updates** - Notification badges, pending notifications panel
✅ **Browser notifications** - Native browser notifications with permission handling
✅ **Toast notifications** - In-app toast messages
✅ **Connection status** - Visual indicator of WebSocket connection status

## Files Modified:

1. `src/app/api/matches/route.ts` - Added real-time notification sending
2. `src/lib/websocket-server.ts` - Server-side WebSocket client for API routes
3. `src/app/matches/page.tsx` - Added notification listener and UI
4. `src/components/Home/Navigation.tsx` - Added global notification listener and badges
5. `server.js` - WebSocket server (already existed)

## Debugging:

- Check browser console for WebSocket connection logs
- Check server console for notification sending logs
- Check Network tab for API calls
- Check Application tab for WebSocket connection status