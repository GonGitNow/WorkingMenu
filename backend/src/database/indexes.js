const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

async function createIndexes() {
    try {
        logger.info('Creating database indexes...');

        // Helper function to create indexes safely
        async function createIndexSafely(model, indexes) {
            try {
                await model.collection.createIndexes(indexes);
                logger.info(`Created indexes for ${model.modelName}`);
            } catch (error) {
                // If indexes already exist, log and continue
                if (error.message.includes('already exists')) {
                    logger.warn(`Indexes already exist for ${model.modelName}`);
                } else {
                    throw error;
                }
            }
        }

        // User indexes
        await createIndexSafely(mongoose.model('User'), [
            { key: { email: 1 }, unique: true, name: 'user_unique_email' }
        ]);

        logger.info('Database indexes created successfully');
    } catch (error) {
        logger.error('Error creating database indexes', { error: error.message });
        throw error;
    }
}

module.exports = { createIndexes }; 