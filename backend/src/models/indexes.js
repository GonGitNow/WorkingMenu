const mongoose = require('mongoose');
const logger = require('../utils/logger');

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

        // Invoice indexes
        await createIndexSafely(mongoose.model('Invoice'), [
            { key: { restaurant: 1, invoiceNumber: 1 }, unique: true, name: 'invoice_unique_number' },
            { key: { restaurant: 1, date: -1 }, name: 'invoice_date' },
            { key: { restaurant: 1, 'vendor.name': 1 }, name: 'invoice_vendor' },
            { key: { restaurant: 1, status: 1 }, name: 'invoice_status' }
        ]);

        // Inventory indexes
        await createIndexSafely(mongoose.model('InventoryItem'), [
            { key: { restaurant: 1, name: 1 }, unique: true, name: 'inventory_unique_name' },
            { key: { restaurant: 1, category: 1 }, name: 'inventory_category' },
            { key: { restaurant: 1, 'vendorItems.vendor': 1 }, name: 'inventory_vendor' },
            { key: { restaurant: 1, currentStock: 1 }, name: 'inventory_stock' }
        ]);

        // Recipe indexes
        await createIndexSafely(mongoose.model('Recipe'), [
            { key: { restaurant: 1, name: 1 }, unique: true, name: 'recipe_unique_name' },
            { key: { restaurant: 1, category: 1 }, name: 'recipe_category' },
            { key: { restaurant: 1, 'ingredients.item': 1 }, name: 'recipe_ingredients' }
        ]);

        // MenuItem indexes
        await createIndexSafely(mongoose.model('MenuItem'), [
            { key: { restaurant: 1, name: 1 }, unique: true, name: 'menuitem_unique_name' },
            { key: { restaurant: 1, category: 1 }, name: 'menuitem_category' },
            { key: { restaurant: 1, price: 1 }, name: 'menuitem_price' }
        ]);

        // User indexes
        await createIndexSafely(mongoose.model('User'), [
            { key: { email: 1 }, unique: true, name: 'user_unique_email' }
        ]);

        // Restaurant indexes
        await createIndexSafely(mongoose.model('Restaurant'), [
            { key: { name: 1, 'location.city': 1 }, name: 'restaurant_location' },
            { key: { parentRestaurant: 1 }, name: 'restaurant_parent' }
        ]);

        logger.info('Database indexes created successfully');
    } catch (error) {
        logger.error('Error creating database indexes', { error: error.message });
        throw error;
    }
}

module.exports = { createIndexes }; 