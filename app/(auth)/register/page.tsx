'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { register } from '@/app/lib/actions/auth-actions';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Client-side password confirmation check
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await register({ name, email, password });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.requiresVerification) {
      setSuccess(result.message || 'Registration successful! Please verify your email.');
      setLoading(false);
    } else {
      window.location.href = '/polls'; // Full reload to pick up session
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">Sign up to start creating and sharing polls</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name"
                type="text" 
                placeholder="John Doe" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required
                autoComplete="new-password"
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
              />
              {showPasswordRequirements && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                  <p className="font-medium mb-1">Password requirements:</p>
                  <ul className="space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• One uppercase letter</li>
                    <li>• One lowercase letter</li>
                    <li>• One number</li>
                    <li>• One special character (!@#$%^&*)</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type="password" 
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded border border-green-200">
                <p className="font-medium">Registration Successful!</p>
                <p>{success}</p>
                <p className="mt-2">
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Return to login
                  </Link>
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !!success}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}