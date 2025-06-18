
import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string().email('Invalid email address').min(1, 'Email is required');

// PIN validation schema
export const pinSchema = z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits');

// Amount validation schema
export const amountSchema = z.number().positive('Amount must be positive').max(10000, 'Amount too large');

// Transaction description schema
export const descriptionSchema = z.string().max(500, 'Description too long').optional();

// API key validation schema
export const apiKeySchema = z.string().regex(/^ak_[A-Za-z0-9_-]{24,}$/, 'Invalid API key format');

// User input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .trim()
    .slice(0, 1000); // Limit length
};

// Validate transfer request
export const transferRequestSchema = z.object({
  recipientEmail: emailSchema,
  amount: amountSchema,
  description: descriptionSchema,
  pin: pinSchema.optional()
});

// Validate payment request
export const paymentRequestSchema = z.object({
  external_order_id: z.string().min(1).max(100),
  user_email: emailSchema,
  amount: amountSchema,
  description: z.string().max(500).optional(),
  callback_url: z.string().url().optional(),
  user_pin: pinSchema.optional()
});

// Rate limiting helper
export const isRateLimited = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const key = `rate_limit_${identifier}`;
  const now = Date.now();
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + windowMs }));
    return false;
  }
  
  const data = JSON.parse(stored);
  
  if (now > data.resetTime) {
    localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + windowMs }));
    return false;
  }
  
  if (data.count >= maxRequests) {
    return true;
  }
  
  data.count++;
  localStorage.setItem(key, JSON.stringify(data));
  return false;
};

// Secure headers utility
export const getSecureHeaders = (): Record<string, string> => ({
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://zygpupmeradizrachnqj.supabase.co",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
});
