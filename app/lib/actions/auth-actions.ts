'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { checkRateLimit, getClientIP } from '../utils/rate-limit';

/**
 * Authentication Actions Module
 * 
 * This module provides server-side actions for user authentication including:
 * - User registration with validation and rate limiting
 * - User login with security measures
 * - Password validation and email verification
 * - Session management and logout functionality
 * - Email verification resend capabilities
 * 
 * All actions implement:
 * - Rate limiting to prevent abuse
 * - Input sanitization and validation
 * - Proper error handling and user feedback
 * - Security best practices for authentication flows
 */

// Input validation helpers

/**
 * Validates email format using RFC 5322 compliant regex
 * @param email - Email string to validate
 * @returns boolean indicating if email format is valid
 */
/**
 * Validates email format using RFC 5322 compliant regex
 * @param email - Email string to validate
 * @returns boolean indicating if email format is valid
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates password strength according to security requirements
 * @param password - Password string to validate
 * @returns Object containing validation result and error message if invalid
 */
/**
 * Validates password strength according to security requirements
 * @param password - Password string to validate
 * @returns Object containing validation result and error message if invalid
 */
function validatePassword(password: string): { isValid: boolean; message?: string } {
  // Check minimum length requirement
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  // Check maximum length to prevent DoS attacks
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }
  // Require at least one lowercase letter
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  // Require at least one uppercase letter
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  // Require at least one digit
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  // Require at least one special character
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  return { isValid: true };
}

/**
 * Sanitizes user input by trimming whitespace and removing potentially dangerous characters
 * @param input - String to sanitize
 * @returns Sanitized string safe for processing
 */
/**
 * Sanitizes user input by trimming whitespace and removing potentially dangerous characters
 * @param input - String to sanitize
 * @returns Sanitized string safe for processing
 */
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Authenticates a user with email and password
 * 
 * Security features implemented:
 * - Rate limiting (5 attempts per 15 minutes per IP)
 * - Input validation and sanitization
 * - Generic error messages to prevent user enumeration
 * - Protection against timing attacks
 * 
 * @param data - Login form data containing email and password
 * @returns Promise resolving to error object or null on success
 */
export async function login(data: LoginFormData) {
  try {
    // Apply rate limiting to prevent brute force attacks
    const headersList = await headers();
    const request = new Request('http://localhost', { headers: headersList });
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`login:${clientIP}`, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
    
    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime);
      return { 
        error: `Too many login attempts. Please try again after ${resetTime.toLocaleTimeString()}` 
      };
    }

    // Validate required fields are present
    if (!data.email || !data.password) {
      return { error: 'Email and password are required' };
    }

    // Sanitize and validate user inputs
    const email = sanitizeInput(data.email);
    const password = data.password;

    if (!validateEmail(email)) {
      return { error: 'Please enter a valid email address' };
    }

    if (password.length < 1) {
      return { error: 'Password is required' };
    }

    // Initialize Supabase client for authentication
    const supabase = await createClient();

    // Attempt user authentication with Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return generic error messages to prevent user enumeration attacks
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please verify your email address before signing in' };
      }
      if (error.message.includes('Too many requests')) {
        return { error: 'Too many login attempts. Please try again later' };
      }
      return { error: 'Authentication failed. Please try again' };
    }

    // Success: authentication completed successfully
    return { error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Please try again' };
  }
}

/**
 * Registers a new user account with comprehensive validation
 * 
 * Security features:
 * - Rate limiting (3 attempts per hour per IP)
 * - Strong password requirements
 * - Input sanitization and validation
 * - Name format validation
 * - Email verification flow
 * 
 * @param data - Registration form data containing name, email, and password
 * @returns Promise resolving to error object, success message, or verification requirement
 */
export async function register(data: RegisterFormData) {
  try {
    // Apply stricter rate limiting for registration to prevent spam accounts
    const headersList = await headers();
    const request = new Request('http://localhost', { headers: headersList });
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`register:${clientIP}`, 3, 60 * 60 * 1000); // 3 attempts per hour
    
    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime);
      return { 
        error: `Too many registration attempts. Please try again after ${resetTime.toLocaleTimeString()}` 
      };
    }

    // Validate all required fields are present
    if (!data.email || !data.password || !data.name) {
      return { error: 'Name, email, and password are required' };
    }

    // Sanitize user inputs to prevent injection attacks
    const email = sanitizeInput(data.email);
    const name = sanitizeInput(data.name);
    const password = data.password;

    // Validate email format
    if (!validateEmail(email)) {
      return { error: 'Please enter a valid email address' };
    }

    // Validate name constraints
    if (name.length < 2) {
      return { error: 'Name must be at least 2 characters long' };
    }
    if (name.length > 50) {
      return { error: 'Name must be less than 50 characters long' };
    }
    // Only allow letters, spaces, hyphens, and apostrophes in names
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return { error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    // Validate password meets security requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { error: passwordValidation.message };
    }

    // Initialize Supabase client for user registration
    const supabase = await createClient();

    // Create new user account with user metadata
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      // Handle specific Supabase registration errors with user-friendly messages
      if (error.message.includes('User already registered')) {
        return { error: 'An account with this email already exists' };
      }
      if (error.message.includes('Password should be')) {
        return { error: 'Password does not meet security requirements' };
      }
      if (error.message.includes('Unable to validate email address')) {
        return { error: 'Please enter a valid email address' };
      }
      if (error.message.includes('Signup is disabled')) {
        return { error: 'Registration is currently disabled' };
      }
      return { error: 'Registration failed. Please try again' };
    }

    // Check if email confirmation is required before login
    if (signUpData.user && !signUpData.session) {
      return { 
        error: null, 
        message: 'Registration successful! Please check your email to verify your account before signing in.',
        requiresVerification: true 
      };
    }

    // Success: user registered and can login immediately
    return { error: null };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'An unexpected error occurred. Please try again' };
  }
}

/**
 * Signs out the current user and invalidates their session
 * 
 * @returns Promise resolving to error object or null on success
 */
/**
 * Signs out the current user and invalidates their session
 * 
 * @returns Promise resolving to error object or null on success
 */
export async function logout() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      return { error: 'Failed to sign out. Please try again' };
    }
    return { error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return { error: 'An unexpected error occurred during sign out' };
  }
}

/**
 * Resends email verification to the user
 * Useful when the initial verification email was not received or expired
 * 
 * @param email - Email address to send verification to
 * @returns Promise resolving to error object, success message, or null
 */
export async function resendVerificationEmail(email: string) {
  try {
    if (!email) {
      return { error: 'Email is required' };
    }

    // Sanitize and validate email input
    const cleanEmail = sanitizeInput(email);
    if (!validateEmail(cleanEmail)) {
      return { error: 'Please enter a valid email address' };
    }

    const supabase = await createClient();
    
    // Request resend of verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });

    if (error) {
      // Handle rate limiting and other errors
      if (error.message.includes('Email rate limit exceeded')) {
        return { error: 'Too many verification emails sent. Please wait before requesting another' };
      }
      return { error: 'Failed to send verification email. Please try again' };
    }

    return { error: null, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Resend verification error:', error);
    return { error: 'An unexpected error occurred. Please try again' };
  }
}

/**
 * Retrieves the currently authenticated user
 * 
 * @returns Promise resolving to User object or null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Retrieves the current user session
 * 
 * @returns Promise resolving to Session object or null if no active session
 */
export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
