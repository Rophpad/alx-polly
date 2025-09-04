interface RateLimitEntry {
  count: number;
  lastAttempt: number;
  blocked: boolean;
}

const attemptStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attemptStore.entries()) {
    // Remove entries older than 1 hour
    if (now - entry.lastAttempt > 60 * 60 * 1000) {
      attemptStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  identifier: string, 
  maxAttempts: number = 5, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now();
  const entry = attemptStore.get(identifier);

  if (!entry) {
    // First attempt
    attemptStore.set(identifier, {
      count: 1,
      lastAttempt: now,
      blocked: false
    });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs
    };
  }

  // Check if enough time has passed to reset
  if (now - entry.lastAttempt > windowMs) {
    // Reset the counter
    attemptStore.set(identifier, {
      count: 1,
      lastAttempt: now,
      blocked: false
    });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs
    };
  }

  // Increment attempt counter
  entry.count += 1;
  entry.lastAttempt = now;

  if (entry.count > maxAttempts) {
    entry.blocked = true;
    attemptStore.set(identifier, entry);
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.lastAttempt + windowMs
    };
  }

  attemptStore.set(identifier, entry);
  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.count,
    resetTime: entry.lastAttempt + windowMs
  };
}

export function clearRateLimit(identifier: string): void {
  attemptStore.delete(identifier);
}

// Get client IP for rate limiting
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback - this might not be the real client IP in production
  return 'unknown';
}
