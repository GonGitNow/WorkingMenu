const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const mongoSanitize = require('express-mongo-sanitize');
const { User } = require('../models/User');
const logger = require('../utils/logger');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Validation rules
const registrationRules = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty()
];

const loginRules = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

// Request validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'Validation failed',
            errors: errors.array() 
        });
    }
    next();
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }

        if (!user.active) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication failed', { error: error.message });
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Restaurant access middleware
const validateRestaurantAccess = async (req, res, next) => {
    const restaurantId = req.params.restaurantId || req.body.restaurantId;
    
    if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    if (!req.user.restaurants.includes(restaurantId)) {
        logger.warn('Unauthorized restaurant access attempt', {
            userId: req.user._id,
            restaurantId
        });
        return res.status(403).json({ message: 'Access denied to this restaurant' });
    }

    next();
};

// Input sanitization middleware
const sanitizeInput = [
    mongoSanitize(),
    (req, res, next) => {
        // Custom sanitization for specific fields
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key].trim();
                }
            });
        }
        next();
    }
];

// Security headers middleware
const securityHeaders = helmet();

module.exports = {
    limiter,
    validateRequest,
    authenticateToken,
    validateRestaurantAccess,
    sanitizeInput,
    securityHeaders,
    registrationRules,
    loginRules
}; 