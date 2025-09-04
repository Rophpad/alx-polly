'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { login, resendVerificationEmail } from '@/app/lib/actions/auth-actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setShowResendVerification(false);
    setResendMessage(null);

    const formData = new FormData(event.currentTarget);
    const emailValue = formData.get('email') as string;
    const password = formData.get('password') as string;

    setEmail(emailValue);

    const result = await login({ email: emailValue, password });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      
      // Show resend verification option if email not confirmed
      if (result.error.includes('verify your email')) {
        setShowResendVerification(true);
      }
    } else {
      // Handle redirect parameter from middleware
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get('redirect');
      window.location.href = redirectPath || '/polls'; // Full reload to pick up session
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage(null);
    setError(null);

    const result = await resendVerificationEmail(email);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setResendMessage('Verification email sent! Please check your inbox and spam folder.');
      setShowResendVerification(false);
    }
    
    setResendLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login to ALX Polly</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {resendMessage && <p className="text-green-500 text-sm">{resendMessage}</p>}
            {showResendVerification && (
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">
                  Need to verify your email?
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full"
                >
                  {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}