import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';

export interface ThrottleConfig {
  limit: number;
  ttl: number; // in seconds
}

/**
 * Rate limiting decorator
 * @param limit - Maximum number of requests
 * @param ttl - Time window in seconds
 */
export const Throttle = (limit: number, ttl: number) =>
  SetMetadata(THROTTLE_KEY, { limit, ttl } as ThrottleConfig);

