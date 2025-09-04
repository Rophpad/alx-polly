'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthCodeErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-red-600">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-center">
            There was a problem verifying your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-slate-600">
            The verification link may have expired or been used already.
          </p>
          <p className="text-sm text-slate-600">
            Please try registering again or contact support if the problem persists.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/register">
              Try Registration Again
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/login">
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
