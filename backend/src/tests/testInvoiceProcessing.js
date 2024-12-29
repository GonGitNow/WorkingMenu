const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");
const { connectToDatabase } = require('../database/connection');
const { Restaurant, User, Invoice, InventoryItem } = require('../models');
const { parseInvoiceData } = require('../services/documentIntelligence');
const fs = require('fs');
const winston = require('winston');
require('dotenv').config();

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Validation functions
async function validateInvoiceData(apiResponse, restaurant) {
    if (!apiResponse.invoiceNumber) {
        throw new Error('Invoice number is required');
    }

    // Check for duplicate invoice numbers
    const existingInvoice = await Invoice.findOne({
        restaurant: restaurant._id,
        invoiceNumber: apiResponse.invoiceNumber
    });

    if (existingInvoice) {
        throw new Error(`Invoice number ${apiResponse.invoiceNumber} already exists`);
    }

    if (!apiResponse.items || apiResponse.items.length === 0) {
        throw new Error('Invoice must contain at least one item');
    }

    // Validate each item
    apiResponse.items.forEach(item => {
        if (!item.description) {
            throw new Error('Item description is required');
        }
        if (!item.quantity || !item.quantity.toString().match(/^\d*\.?\d+$/)) {
            throw new Error(`Invalid quantity for item: ${item.description}`);
        }
        if (!item.unitPrice || !item.unitPrice.toString().match(/^\d*\.?\d+$/)) {
            throw new Error(`Invalid unit price for item: ${item.description}`);
        }
    });

    return true;
}

// Retry logic for Azure API
async function retryOperation(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, { error: error.message });
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function processAndSaveInvoice() {
    let testRestaurant, testUser;
    try {
        logger.info('Starting invoice processing test...');
        
        // Connect to database
        await connectToDatabase();
        logger.info('Database connected successfully');

        // Create test restaurant
        testRestaurant = new Restaurant({
            name: 'Test Restaurant',
            location: {
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345'
            }
        });
        await testRestaurant.save();
        logger.info('Test restaurant created', { restaurantId: testRestaurant._id });

        // Create test user
        testUser = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpassword123',
            restaurants: [testRestaurant._id]
        });
        await testUser.save();
        logger.info('Test user created', { userId: testUser._id });

        // Initialize Azure client
        const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
        const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
        
        if (!key || !endpoint) {
            throw new Error('Azure credentials not configured');
        }

        const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));

        // Process invoice with retry logic
        const invoicePath = 'drive-download-20241225T195913Z-001/20241223_181829.jpg';
        if (!fs.existsSync(invoicePath)) {
            throw new Error('Invoice file not found');
        }

        const imageBuffer = fs.readFileSync(invoicePath);
        logger.info('Processing invoice...', { path: invoicePath });

        const result = await retryOperation(async () => {
            const poller = await client.beginAnalyzeDocument("prebuilt-invoice", imageBuffer);
            return await poller.pollUntilDone();
        });

        // Parse and validate invoice data
        const apiResponse = parseInvoiceData(result);
        await validateInvoiceData(apiResponse, testRestaurant);

        // Create inventory items with error handling
        const inventoryItems = [];
        for (const item of apiResponse.items) {
            try {
                const inventoryItem = new InventoryItem({
                    restaurant: testRestaurant._id,
                    name: item.description,
                    category: 'Imported from Invoice',
                    unit: item.unit,
                    vendorItems: [{
                        vendor: apiResponse.vendor.name,
                        productCode: item.productCode,
                        packSize: {
                            value: item.quantity,
                            unit: item.unit
                        }
                    }],
                    currentPrice: {
                        value: item.unitPrice,
                        unit: item.unit
                    }
                });
                await inventoryItem.save();
                inventoryItems.push(inventoryItem);
                logger.info('Created inventory item', { 
                    itemName: item.description,
                    itemId: inventoryItem._id 
                });
            } catch (error) {
                logger.error('Failed to create inventory item', {
                    itemDescription: item.description,
                    error: error.message
                });
                throw error;
            }
        }

        // Create invoice with transaction
        const session = await Invoice.startSession();
        await session.withTransaction(async () => {
            const invoice = new Invoice({
                restaurant: testRestaurant._id,
                invoiceNumber: apiResponse.invoiceNumber,
                vendor: apiResponse.vendor,
                date: apiResponse.date || new Date(),
                items: apiResponse.items.map((item, index) => ({
                    description: item.description,
                    productCode: item.productCode,
                    quantity: {
                        value: item.quantity,
                        unit: item.unit
                    },
                    unitPrice: {
                        value: item.unitPrice,
                        unit: item.unit
                    },
                    totalPrice: item.amount,
                    mappedInventoryItem: inventoryItems[index]._id
                })),
                subtotal: apiResponse.subTotal,
                status: 'processed',
                processedBy: testUser._id,
                originalImage: invoicePath
            });

            await invoice.save({ session });
            logger.info('Invoice saved successfully', { 
                invoiceId: invoice._id,
                invoiceNumber: invoice.invoiceNumber
            });

            // Verify data
            const savedInvoice = await Invoice.findById(invoice._id)
                .populate('items.mappedInventoryItem')
                .populate('processedBy')
                .populate('restaurant');

            logger.info('Invoice verification completed', {
                invoiceNumber: savedInvoice.invoiceNumber,
                vendor: savedInvoice.vendor.name,
                itemCount: savedInvoice.items.length,
                subtotal: savedInvoice.subtotal
            });
        });
        session.endSession();

    } catch (error) {
        logger.error('Error during invoice processing', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        // Clean up with error handling
        try {
            if (testRestaurant) {
                await Restaurant.deleteOne({ _id: testRestaurant._id });
            }
            if (testUser) {
                await User.deleteOne({ _id: testUser._id });
            }
            await Invoice.deleteMany({ restaurant: testRestaurant?._id });
            await InventoryItem.deleteMany({ restaurant: testRestaurant?._id });
            logger.info('Test data cleaned up successfully');
        } catch (cleanupError) {
            logger.error('Error during cleanup', {
                error: cleanupError.message
            });
        }
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

processAndSaveInvoice().catch(error => {
    logger.error('Fatal error in invoice processing', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
}); 