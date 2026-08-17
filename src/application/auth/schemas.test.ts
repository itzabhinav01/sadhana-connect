import { describe, expect, it } from 'vitest'

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/application/auth/schemas'

describe('signInSchema', () => {
  it('accepts valid credentials', () => {
    const result = signInSchema.safeParse({
      email: 'devotee@example.com',
      password: 'anything',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = signInSchema.safeParse({
      email: 'not-an-email',
      password: 'anything',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty password', () => {
    const result = signInSchema.safeParse({
      email: 'devotee@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('signUpSchema', () => {
  const valid = {
    fullName: 'Umang Singadiya',
    email: 'devotee@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  }

  it('accepts valid registration input', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      ...valid,
      password: 'short1',
      confirmPassword: 'short1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      ...valid,
      confirmPassword: 'different123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('confirmPassword')
    }
  })

  it('rejects a blank full name', () => {
    const result = signUpSchema.safeParse({ ...valid, fullName: '   ' })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(
      forgotPasswordSchema.safeParse({ email: 'devotee@example.com' })
        .success,
    ).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(
      false,
    )
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords of sufficient length', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'password123',
      confirmPassword: 'password124',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a short password', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'short1',
      confirmPassword: 'short1',
    })
    expect(result.success).toBe(false)
  })
})
