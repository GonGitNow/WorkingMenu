const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    price: {
        value: Number,
        unit: String
    },
    source: {
        type: String,
        enum: ['invoice', 'manual'],
        required: true
    },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    }
});

const inventoryItemSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    currentStock: {
        type: Number,
        default: 0
    },
    reorderPoint: Number,
    idealStock: Number,
    vendorItems: [{
        vendor: String,
        productCode: String,
        packSize: {
            value: Number,
            unit: String
        }
    }],
    priceHistory: [priceHistorySchema],
    currentPrice: {
        value: Number,
        unit: String
    },
    location: String,
    notes: String,
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
inventoryItemSchema.index({ restaurant: 1, name: 1 });
inventoryItemSchema.index({ restaurant: 1, category: 1 });
inventoryItemSchema.index({ 'vendorItems.productCode': 1 });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

module.exports = InventoryItem; 