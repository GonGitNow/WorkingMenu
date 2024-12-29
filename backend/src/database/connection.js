const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectToDatabase() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MongoDB connection string not found');
        }

        await mongoose.connect(uri);
        logger.info('Connected to MongoDB');

        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

module.exports = { connectToDatabase }; 