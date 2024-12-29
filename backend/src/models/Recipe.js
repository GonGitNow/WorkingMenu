const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    quantity: {
        value: Number,
        unit: String
    },
    notes: String
});

const recipeSchema = new mongoose.Schema({
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
    category: String,
    description: String,
    ingredients: [ingredientSchema],
    yield: {
        value: Number,
        unit: String
    },
    instructions: [{
        step: Number,
        description: String
    }],
    prepTime: Number, // in minutes
    cookTime: Number, // in minutes
    totalTime: Number, // in minutes
    costHistory: [{
        date: Date,
        costPerUnit: Number,
        totalCost: Number
    }],
    currentCost: {
        costPerUnit: Number,
        totalCost: Number,
        lastUpdated: Date
    },
    pricing: {
        strategy: {
            type: String,
            enum: ['margin', 'fixed'],
            required: true,
            default: 'margin'
        },
        targetMargin: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.7 // 70% margin
        },
        fixedPrice: {
            type: Number,
            min: 0
        },
        currentPrice: {
            type: Number,
            min: 0
        },
        actualMargin: {
            type: Number,
            min: 0,
            max: 1
        },
        lastCalculated: Date
    },
    priceHistory: [{
        date: Date,
        price: Number,
        margin: Number,
        strategy: String
    }],
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
recipeSchema.index({ restaurant: 1, name: 1 });
recipeSchema.index({ restaurant: 1, category: 1 });

// Pre-save middleware to calculate price or margin
recipeSchema.pre('save', function(next) {
    if (this.currentCost.totalCost && this.pricing) {
        if (this.pricing.strategy === 'margin' && this.pricing.targetMargin) {
            // Calculate price based on target margin
            // Price = Cost / (1 - Target Margin)
            this.pricing.currentPrice = this.currentCost.totalCost / (1 - this.pricing.targetMargin);
            this.pricing.actualMargin = this.pricing.targetMargin;
        } else if (this.pricing.strategy === 'fixed' && this.pricing.fixedPrice) {
            // Calculate actual margin from fixed price
            // Margin = (Price - Cost) / Price
            this.pricing.currentPrice = this.pricing.fixedPrice;
            this.pricing.actualMargin = (this.pricing.fixedPrice - this.currentCost.totalCost) / this.pricing.fixedPrice;
        }
        
        this.pricing.lastCalculated = new Date();
        
        // Add to price history if price changed
        const lastPrice = this.priceHistory && this.priceHistory.length > 0 
            ? this.priceHistory[this.priceHistory.length - 1] 
            : null;
            
        if (!lastPrice || 
            lastPrice.price !== this.pricing.currentPrice || 
            lastPrice.margin !== this.pricing.actualMargin) {
            this.priceHistory.push({
                date: new Date(),
                price: this.pricing.currentPrice,
                margin: this.pricing.actualMargin,
                strategy: this.pricing.strategy
            });
        }
    }
    next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe; 