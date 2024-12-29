const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
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
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
    },
    active: {
        type: Boolean,
        default: true
    },
    costHistory: [{
        cost: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    currentCost: {
        type: Number,
        min: 0
    }
}, {
    timestamps: true
});

// Add compound index for restaurant and name
menuItemSchema.index({ restaurant: 1, name: 1 }, { unique: true });

// Add index for category and price queries
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, price: 1 });

// Calculate profit margin
menuItemSchema.virtual('profitMargin').get(function() {
    if (!this.currentCost || !this.price) return null;
    return ((this.price - this.currentCost) / this.price) * 100;
});

// Update current cost and add to history
menuItemSchema.methods.updateCost = async function(newCost) {
    this.costHistory.push({
        cost: newCost,
        date: new Date()
    });
    this.currentCost = newCost;
    return this.save();
};

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem; 