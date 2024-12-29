const { connectToDatabase } = require('../database/connection');
const { createIndexes } = require('../models/indexes');
const { Restaurant, User, Invoice, InventoryItem } = require('../models');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");
const fs = require('fs');
require('dotenv').config();

// Generate unique test data
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function testSystem() {
    let testRestaurant, testUser;
    try {
        logger.info('Starting system test...');

        // 1. Test Database Connection
        logger.info('Testing database connection...');
        await connectToDatabase();
        logger.info('✓ Database connected successfully');

        // 2. Test Database Indexes
        logger.info('Testing database indexes...');
        await createIndexes();
        logger.info('✓ Database indexes created successfully');

        // 3. Test User Creation and JWT
        logger.info('Testing user creation and JWT...');
        const uniqueId = generateUniqueId();
        testRestaurant = new Restaurant({
            name: `Test Restaurant ${uniqueId}`,
            location: {
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345'
            }
        });
        await testRestaurant.save();

        testUser = new User({
            username: `testuser_${uniqueId}`,
            email: `test_${uniqueId}@example.com`,
            password: 'testpassword123',
            restaurants: [testRestaurant._id]
        });
        await testUser.save();

        const token = jwt.sign(
            { userId: testUser._id },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
        logger.info('✓ User creation and JWT generation successful');

        // 4. Test Azure Document Intelligence
        logger.info('Testing Azure Document Intelligence...');
        const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
        const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
        
        if (!key || !endpoint) {
            throw new Error('Azure credentials not configured');
        }

        const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
        const invoicePath = 'drive-download-20241225T195913Z-001/20241223_181829.jpg';
        
        if (!fs.existsSync(invoicePath)) {
            throw new Error('Test invoice file not found');
        }

        const imageBuffer = fs.readFileSync(invoicePath);
        const poller = await client.beginAnalyzeDocument("prebuilt-invoice", imageBuffer);
        const result = await poller.pollUntilDone();
        
        if (!result) {
            throw new Error('Azure Document Intelligence analysis failed');
        }
        logger.info('✓ Azure Document Intelligence working successfully');

        // 5. Test Invoice Processing and Storage
        logger.info('Testing invoice processing and storage...');
        const invoice = new Invoice({
            restaurant: testRestaurant._id,
            invoiceNumber: `TEST-${uniqueId}`,
            vendor: {
                name: 'Test Vendor',
                address: '456 Vendor St'
            },
            date: new Date(),
            items: [{
                description: 'Test Item',
                productCode: `TEST${uniqueId}`,
                quantity: { value: 1, unit: 'EA' },
                unitPrice: { value: 10.99, unit: 'EA' },
                totalPrice: 10.99
            }],
            subtotal: 10.99,
            status: 'processed',
            processedBy: testUser._id
        });
        await invoice.save();
        logger.info('✓ Invoice processing and storage successful');

        // Cleanup
        logger.info('Cleaning up test data...');
        await Restaurant.deleteOne({ _id: testRestaurant._id });
        await User.deleteOne({ _id: testUser._id });
        await Invoice.deleteOne({ _id: invoice._id });
        logger.info('✓ Test data cleaned up successfully');

        logger.info('All system tests completed successfully! ✓');
        process.exit(0);
    } catch (error) {
        logger.error('System test failed', {
            error: error.message,
            stack: error.stack
        });

        // Cleanup on error
        if (testRestaurant) {
            await Restaurant.deleteOne({ _id: testRestaurant._id }).catch(() => {});
        }
        if (testUser) {
            await User.deleteOne({ _id: testUser._id }).catch(() => {});
        }

        process.exit(1);
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection in system test', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

testSystem(); 