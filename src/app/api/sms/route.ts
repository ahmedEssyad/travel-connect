import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSMSService, formatPhoneNumber, isValidPhoneNumber } from '@/lib/sms-service';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import { validateData } from '@/lib/validation-schemas';
import { z } from 'zod';

// SMS validation schemas
const sendBloodRequestSMSSchema = z.object({
  donorPhone: z.string().min(1, 'Donor phone is required'),
  donorName: z.string().min(1, 'Donor name is required'),
  donorBloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  request: z.object({
    requestId: z.string().min(1, 'Request ID is required'),
    urgency: z.enum(['critical', 'urgent', 'standard']),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    patientAge: z.number().min(0).max(150),
    condition: z.string().min(1, 'Condition is required'),
    hospital: z.object({
      name: z.string().min(1, 'Hospital name is required'),
      address: z.string().min(1, 'Hospital address is required'),
      phone: z.string().min(1, 'Hospital phone is required')
    }),
    requiredUnits: z.number().min(1).max(10),
    deadline: z.string().datetime()
  })
});

const sendDonorResponseSMSSchema = z.object({
  requesterPhone: z.string().min(1, 'Requester phone is required'),
  donorName: z.string().min(1, 'Donor name is required'),
  donorBloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  response: z.enum(['accepted', 'declined']),
  requestId: z.string().min(1, 'Request ID is required')
});

const sendVerificationSMSSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  code: z.string().min(4, 'Code must be at least 4 characters').max(10, 'Code too long')
});

const sendReminderSMSSchema = z.object({
  donorPhone: z.string().min(1, 'Donor phone is required'),
  donorName: z.string().min(1, 'Donor name is required'),
  hospitalName: z.string().min(1, 'Hospital name is required'),
  appointmentTime: z.string().datetime(),
  requestId: z.string().min(1, 'Request ID is required')
});

const sendThankYouSMSSchema = z.object({
  donorPhone: z.string().min(1, 'Donor phone is required'),
  donorName: z.string().min(1, 'Donor name is required'),
  hospitalName: z.string().min(1, 'Hospital name is required'),
  unitsdonated: z.number().min(1).max(10)
});

export async function POST(request: NextRequest) {
  let body: any = null;
  
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    body = await request.json();
    const { type, ...data } = body;

    if (!type) {
      throw createApiError('SMS type is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    const smsService = getSMSService();
    let result = false;

    switch (type) {
      case 'blood-request':
        {
          const validation = validateData(sendBloodRequestSMSSchema, data);
          if (!validation.success) {
            throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          const { donorPhone, donorName, donorBloodType, request: requestData } = validation.data;
          
          // Validate and format phone number
          const formattedPhone = formatPhoneNumber(donorPhone);
          if (!isValidPhoneNumber(formattedPhone)) {
            throw createApiError('Invalid phone number format', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          const donor = {
            name: donorName,
            phone: formattedPhone,
            bloodType: donorBloodType
          };

          const bloodRequest = {
            ...requestData,
            deadline: new Date(requestData.deadline)
          };

          result = await smsService.sendBloodRequestSMS(donor, bloodRequest);
        }
        break;

      case 'donor-response':
        {
          const validation = validateData(sendDonorResponseSMSSchema, data);
          if (!validation.success) {
            throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          const { requesterPhone, donorName, donorBloodType, response, requestId } = validation.data;
          
          const formattedPhone = formatPhoneNumber(requesterPhone);
          if (!isValidPhoneNumber(formattedPhone)) {
            throw createApiError('Invalid phone number format', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          result = await smsService.sendDonorResponseSMS(
            formattedPhone, 
            donorName, 
            donorBloodType, 
            response, 
            requestId
          );
        }
        break;

      case 'verification':
        {
          const validation = validateData(sendVerificationSMSSchema, data);
          if (!validation.success) {
            throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          const { phone, code } = validation.data;
          
          const formattedPhone = formatPhoneNumber(phone);
          if (!isValidPhoneNumber(formattedPhone)) {
            throw createApiError('Invalid phone number format', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          result = await smsService.sendVerificationSMS(formattedPhone, code);
        }
        break;

      case 'reminder':
        {
          const validation = validateData(sendReminderSMSSchema, data);
          if (!validation.success) {
            throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          const { donorPhone, donorName, hospitalName, appointmentTime, requestId } = validation.data;
          
          const formattedPhone = formatPhoneNumber(donorPhone);
          if (!isValidPhoneNumber(formattedPhone)) {
            throw createApiError('Invalid phone number format', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          result = await smsService.sendDonationReminderSMS(
            formattedPhone,
            donorName,
            hospitalName,
            new Date(appointmentTime),
            requestId
          );
        }
        break;

      case 'thank-you':
        {
          const validation = validateData(sendThankYouSMSSchema, data);
          if (!validation.success) {
            throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          const { donorPhone, donorName, hospitalName, unitsdonated } = validation.data;
          
          const formattedPhone = formatPhoneNumber(donorPhone);
          if (!isValidPhoneNumber(formattedPhone)) {
            throw createApiError('Invalid phone number format', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
          }

          result = await smsService.sendThankYouSMS(
            formattedPhone,
            donorName,
            hospitalName,
            unitsdonated
          );
        }
        break;

      default:
        throw createApiError('Invalid SMS type', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully'
      });
    } else {
      throw createApiError('Failed to send SMS', HttpStatus.INTERNAL_SERVER_ERROR, ErrorTypes.EXTERNAL_SERVICE_ERROR);
    }

  } catch (error) {
    console.error('SMS API error:', error);
    logError(error, 'POST /api/sms', { 
      userId: request.headers.get('x-user-id'),
      smsType: body?.type 
    });
    return handleApiError(error, 'POST /api/sms');
  }
}

// Handle SMS webhooks from Twilio
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      // Health check endpoint
      return NextResponse.json({
        status: 'healthy',
        service: 'SMS Service',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      message: 'SMS service is running',
      endpoints: {
        send: 'POST /api/sms',
        status: 'GET /api/sms?action=status'
      }
    });

  } catch (error) {
    logError(error, 'GET /api/sms');
    return handleApiError(error, 'GET /api/sms');
  }
}

// Handle Twilio webhooks for delivery status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage } = body;

    console.log('Twilio webhook received:', {
      MessageSid,
      MessageStatus,
      To,
      From,
      ErrorCode,
      ErrorMessage
    });

    // You can store delivery status in database here
    // For now, we'll just log it

    if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      console.error('SMS delivery failed:', {
        MessageSid,
        To,
        ErrorCode,
        ErrorMessage
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed'
    });

  } catch (error) {
    console.error('Twilio webhook error:', error);
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed'
    }, { status: 500 });
  }
}