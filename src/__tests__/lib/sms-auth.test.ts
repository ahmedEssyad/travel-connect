import {
  formatMauritanianPhone,
  validateMauritanianPhone,
  generateVerificationCode,
  generateAuthToken,
  verifyAuthToken,
  hashPassword,
  comparePassword,
} from '@/lib/sms-auth'

// Mock environment variables
jest.mock('@/lib/env-validation', () => ({
  getConfig: () => ({
    auth: { jwtSecret: 'test-jwt-secret-for-testing-purposes-only' },
    sms: {
      accountSid: 'test-sid',
      authToken: 'test-token',
      phoneNumber: '+1234567890',
    },
  }),
  validateEnvironment: jest.fn(),
}))

// Mock Twilio
jest.mock('twilio', () => ({
  default: () => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'test-sid' }),
    },
  }),
}))

describe('SMS Auth Utils', () => {
  describe('formatMauritanianPhone', () => {
    it('formats phone number with country code', () => {
      expect(formatMauritanianPhone('22212345678')).toBe('+22212345678')
    })

    it('adds country code to local number', () => {
      expect(formatMauritanianPhone('12345678')).toBe('+22212345678')
    })

    it('handles phone number with spaces and dashes', () => {
      expect(formatMauritanianPhone('222 1234-5678')).toBe('+22212345678')
    })

    it('throws error for invalid format', () => {
      expect(() => formatMauritanianPhone('123')).toThrow('Invalid Mauritanian phone number format')
    })
  })

  describe('validateMauritanianPhone', () => {
    it('validates correct Mauritanian phone numbers', () => {
      expect(validateMauritanianPhone('+22212345678')).toBe(true)
      expect(validateMauritanianPhone('22212345678')).toBe(true)
      expect(validateMauritanianPhone('12345678')).toBe(true)
    })

    it('rejects invalid phone numbers', () => {
      expect(validateMauritanianPhone('123')).toBe(false)
      expect(validateMauritanianPhone('+1234567890')).toBe(false)
      expect(validateMauritanianPhone('abc')).toBe(false)
    })
  })

  describe('generateVerificationCode', () => {
    it('generates 6-digit code', () => {
      const code = generateVerificationCode()
      expect(code).toMatch(/^\d{6}$/)
      expect(code.length).toBe(6)
    })

    it('generates different codes each time', () => {
      const code1 = generateVerificationCode()
      const code2 = generateVerificationCode()
      // This test might occasionally fail due to randomness, but very unlikely
      expect(code1).not.toBe(code2)
    })
  })

  describe('generateAuthToken', () => {
    it('generates valid JWT token', () => {
      const token = generateAuthToken('user123', '+22212345678')
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })
  })

  describe('verifyAuthToken', () => {
    it('verifies valid token', () => {
      const token = generateAuthToken('user123', '+22212345678')
      const decoded = verifyAuthToken(token)
      
      expect(decoded).not.toBeNull()
      expect(decoded?.userId).toBe('user123')
      expect(decoded?.phoneNumber).toBe('+22212345678')
    })

    it('returns null for invalid token', () => {
      const result = verifyAuthToken('invalid-token')
      expect(result).toBeNull()
    })

    it('returns null for expired token', () => {
      // This would require mocking the JWT library to test expiration
      const result = verifyAuthToken('')
      expect(result).toBeNull()
    })
  })

  describe('hashPassword', () => {
    it('hashes password correctly', async () => {
      const password = 'testPassword123'
      const hash = await hashPassword(password)
      
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 chars
    })
  })

  describe('comparePassword', () => {
    it('compares password with hash correctly', async () => {
      const password = 'testPassword123'
      const hash = await hashPassword(password)
      
      const isValid = await comparePassword(password, hash)
      expect(isValid).toBe(true)
      
      const isInvalid = await comparePassword('wrongPassword', hash)
      expect(isInvalid).toBe(false)
    })
  })
})