/**
 * Server-side SMS service using Twilio
 * This file should only be imported in API routes or server-side code
 */

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    // Check if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      // Log the SMS that would be sent (for development)
      console.log('📱 SMS would be sent (development mode):', {
        to: phoneNumber,
        from: fromNumber || '+222XXXXXXXX',
        message
      });
      return { success: true, sid: 'dev_' + Date.now() };
    }

    // Dynamic import of Twilio (server-side only)
    const { default: Twilio } = await import('twilio');
    const client = Twilio(accountSid, authToken);
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: phoneNumber
    });

    console.log('✅ SMS sent successfully:', result.sid);
    return { success: true, sid: result.sid };
    
  } catch (error: any) {
    console.error('❌ SMS sending failed:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to send SMS' 
    };
  }
}