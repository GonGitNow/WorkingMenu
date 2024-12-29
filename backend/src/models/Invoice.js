const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    productCode: String,
    quantity: {
        value: Number,
        unit: String
    },
    unitPrice: {
        value: Number,
        unit: String
    },
    totalPrice: Number,
    mappedInventoryItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem'
    }
});

const invoiceSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    invoiceNumber: {
        type: String,
        required: true
    },
    vendor: {
        name: String,
        address: String
    },
    date: {
        type: Date,
        required: true
    },
    items: [invoiceItemSchema],
    subtotal: Number,
    tax: Number,
    total: Number,
    status: {
        type: String,
        enum: ['pending', 'processed', 'error'],
        default: 'pending'
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    originalImage: String,
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

// Index for efficient querying
invoiceSchema.index({ restaurant: 1, date: -1 });
invoiceSchema.index({ invoiceNumber: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice; 