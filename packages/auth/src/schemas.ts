import { z } from 'zod'

import { phoneNumberField } from './phone-number-schema'

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')

// Client-side minimum only — intentionally not attempting to replicate
// Supabase's own server-side password policy.
const passwordField = z.string().min(8, 'Password must be at least 8 characters')

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
})
export type SignInInput = z.infer<typeof signInSchema>

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required'),
    email: emailField,
    phoneNumber: phoneNumberField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type SignUpInput = z.infer<typeof signUpSchema>

export const forgotPasswordSchema = z.object({
  email: emailField,
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
