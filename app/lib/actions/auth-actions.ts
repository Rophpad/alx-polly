'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { checkRateLimit, getClientIP } from '../utils/rate-limit';

// Input validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  return { isValid: true };
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export async function login(data: LoginFormData) {
  try {
    // Rate limiting check
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

    // Input validation
    if (!data.email || !data.password) {
      return { error: 'Email and password are required' };
    }

    const email = sanitizeInput(data.email);
    const password = data.password;

    if (!validateEmail(email)) {
      return { error: 'Please enter a valid email address' };
    }

    if (password.length < 1) {
      return { error: 'Password is required' };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Don't expose sensitive error details
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

    // Success: no error
    return { error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Please try again' };
  }
}

export async function register(data: RegisterFormData) {
  try {
    // Rate limiting check
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

    // Input validation
    if (!data.email || !data.password || !data.name) {
      return { error: 'Name, email, and password are required' };
    }

    const email = sanitizeInput(data.email);
    const name = sanitizeInput(data.name);
    const password = data.password;

    // Validate email
    if (!validateEmail(email)) {
      return { error: 'Please enter a valid email address' };
    }

    // Validate name
    if (name.length < 2) {
      return { error: 'Name must be at least 2 characters long' };
    }
    if (name.length > 50) {
      return { error: 'Name must be less than 50 characters long' };
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return { error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { error: passwordValidation.message };
    }

    const supabase = await createClient();

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
      // Handle specific Supabase errors
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

    // Check if email confirmation is required
    if (signUpData.user && !signUpData.session) {
      return { 
        error: null, 
        message: 'Registration successful! Please check your email to verify your account before signing in.',
        requiresVerification: true 
      };
    }

    // Success: no error
    return { error: null };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'An unexpected error occurred. Please try again' };
  }
}

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

export async function resendVerificationEmail(email: string) {
  try {
    if (!email) {
      return { error: 'Email is required' };
    }

    const cleanEmail = sanitizeInput(email);
    if (!validateEmail(cleanEmail)) {
      return { error: 'Please enter a valid email address' };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });

    if (error) {
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

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
