import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase and number'
    ),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ---------------------------------------------------------------------------
// Checkout schema
// ---------------------------------------------------------------------------

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  customerEmail: z.string().email('Enter a valid email address'),
  customerPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  shippingAddress: z.object({
    address: z
      .string()
      .min(5, 'Address must be at least 5 characters')
      .max(200, 'Address is too long'),
    city: z
      .string()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City name is too long'),
    state: z
      .string()
      .min(2, 'State must be at least 2 characters')
      .max(100, 'State name is too long'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z
          .number()
          .int('Quantity must be a whole number')
          .min(1, 'Quantity must be at least 1')
          .max(50, 'Maximum 50 units per item'),
      })
    )
    .min(1, 'Order must contain at least one item'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

// ---------------------------------------------------------------------------
// OTP schemas
// ---------------------------------------------------------------------------

export const otpSendSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
});

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

// ---------------------------------------------------------------------------
// Address schema
// ---------------------------------------------------------------------------

export const addressSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address is too long'),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City name is too long'),
  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State name is too long'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  isDefault: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OtpSendInput = z.infer<typeof otpSendSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type AddressInput = z.infer<typeof addressSchema>;
