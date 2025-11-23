/**
 * Form validation utilities
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,11}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return passwordRegex.test(password)
}

export const validateRequired = (value: string): string | undefined => {
  return value.trim() ? undefined : 'This field is required'
}

export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Email is required'
  if (!isValidEmail(email)) return 'Invalid email format'
  return undefined
}

export const validatePhone = (phone: string): string | undefined => {
  if (!phone.trim()) return 'Phone number is required'
  if (!isValidPhone(phone)) return 'Invalid phone number'
  return undefined
}

export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required'
  if (!isValidPassword(password)) {
    return 'Password must be at least 8 characters with uppercase, lowercase and number'
  }
  return undefined
}
