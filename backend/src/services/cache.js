const Redis = require('redis');
const { promisify } = require('util');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        this.client = Redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            retry_strategy: function(options) {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    return new Error('The server refused the connection');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    return new Error('Retry time exhausted');
                }
                if (options.attempt > 10) {
                    return undefined;
                }
                return Math.min(options.attempt * 100, 3000);
            }
        });

        this.client.on('error', (err) => logger.error('Redis Client Error', { error: err.message }));
        this.client.on('connect', () => logger.info('Connected to Redis'));

        // Promisify Redis commands
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);
    }

    async get(key) {
        try {
            const data = await this.getAsync(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Cache get error', { key, error: error.message });
            return null;
        }
    }

    async set(key, value, expirySeconds = 3600) {
        try {
            const stringValue = JSON.stringify(value);
            await this.setAsync(key, stringValue, 'EX', expirySeconds);
            return true;
        } catch (error) {
            logger.error('Cache set error', { key, error: error.message });
            return false;
        }
    }

    async del(key) {
        try {
            await this.delAsync(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error', { key, error: error.message });
            return false;
        }
    }

    generateKey(prefix, params) {
        return `${prefix}:${Object.values(params).join(':')}`;
    }

    // Cache middleware for routes
    cacheMiddleware(prefix, paramExtractor) {
        return async (req, res, next) => {
            try {
                const params = paramExtractor(req);
                const key = this.generateKey(prefix, params);
                
                const cachedData = await this.get(key);
                if (cachedData) {
                    return res.json(cachedData);
                }

                // Store original send function
                const originalSend = res.json;
                
                // Override send function to cache response
                res.json = function(body) {
                    this.cache.set(key, body);
                    originalSend.call(this, body);
                }.bind({ cache: this });

                next();
            } catch (error) {
                logger.error('Cache middleware error', { error: error.message });
                next();
            }
        };
    }

    // Invalidate cache for specific patterns
    async invalidatePattern(pattern) {
        try {
            const keys = await promisify(this.client.keys).bind(this.client)(pattern);
            if (keys.length > 0) {
                await Promise.all(keys.map(key => this.del(key)));
                logger.info('Cache invalidated', { pattern, keysCount: keys.length });
            }
        } catch (error) {
            logger.error('Cache invalidation error', { pattern, error: error.message });
        }
    }
}

// Export singleton instance
module.exports = new CacheService(); 