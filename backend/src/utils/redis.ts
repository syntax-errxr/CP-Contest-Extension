import Redis from 'ioredis';
import { config } from '../config';

let redisClient: Redis | null = null;

if (config.redisUrl) {
  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true, // Don't block startup
    });
    
    redisClient.connect().catch((err) => {
      console.warn('Could not connect to Redis server, caching will use in-memory fallback:', err.message);
      redisClient = null;
    });

    redisClient.on('error', (err) => {
      console.warn('Redis runtime connection warning:', err.message);
    });
  } catch (error: any) {
    console.warn('Failed to initialize Redis client, using in-memory fallback:', error.message);
    redisClient = null;
  }
} else {
  console.log('No REDIS_URL configured, using in-memory cache.');
}

export const redis = redisClient;
