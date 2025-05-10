/**
 * Simple rate limiter for API routes
 */
export class RateLimiter {
  private windowMs: number;
  private max: number;
  private standardHeaders: boolean;
  private message: string;
  private store: Map<string, { count: number, resetTime: number }>;
  
  constructor({
    windowMs = 60000, // 1 minute
    max = 100,
    standardHeaders = true,
    message = 'Too many requests, please try again later'
  } = {}) {
    this.windowMs = windowMs;
    this.max = max;
    this.standardHeaders = standardHeaders;
    this.message = message;
    this.store = new Map();
    
    // Clean up old entries periodically
    setInterval(() => this.cleanup(), windowMs);
  }
  
  /**
   * Check if the request is within rate limits
   * @param req Request object
   * @returns Result object with success flag and headers
   */
  async check(req: Request): Promise<{
    success: boolean;
    message: string;
    headers: Record<string, string | number>;
    remaining: number;
  }> {
    const now = Date.now();
    const ip = this.getIP(req) || 'unknown';
    const key = `${ip}`;
    
    // Get or initialize rate info for this key
    const rateInfo = this.store.get(key) || { 
      count: 0, 
      resetTime: now + this.windowMs 
    };
    
    // If the window has expired, reset the counter
    if (rateInfo.resetTime <= now) {
      rateInfo.count = 0;
      rateInfo.resetTime = now + this.windowMs;
    }
    
    // Increment count
    rateInfo.count += 1;
    this.store.set(key, rateInfo);
    
    // Calculate remaining requests and prepare headers
    const remaining = Math.max(0, this.max - rateInfo.count);
    const resetTime = new Date(rateInfo.resetTime);
    
    const headers: Record<string, string | number> = {};
    
    if (this.standardHeaders) {
      headers['X-RateLimit-Limit'] = this.max;
      headers['X-RateLimit-Remaining'] = remaining;
      headers['X-RateLimit-Reset'] = Math.ceil(rateInfo.resetTime / 1000);
    }
    
    // Check if rate limit has been exceeded
    const exceeded = rateInfo.count > this.max;
    
    if (exceeded) {
      headers['Retry-After'] = Math.ceil((rateInfo.resetTime - now) / 1000);
    }
    
    return {
      success: !exceeded,
      message: exceeded ? this.message : '',
      headers,
      remaining
    };
  }
  
  /**
   * Clean up expired entries from the store
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, info] of this.store.entries()) {
      if (info.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }
  
  /**
   * Get the client IP address from the request
   * @param req Request object
   * @returns IP address or null
   */
  private getIP(req: Request): string | null {
    // Try to get IP from headers (for proxied requests)
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    // Get IP from request
    const ip = (req as any).socket?.remoteAddress;
    return ip || null;
  }
}