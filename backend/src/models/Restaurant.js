const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        address: String,
        city: String,
        state: String,
        zipCode: String
    },
    contact: {
        phone: String,
        email: String
    },
    settings: {
        timezone: String,
        currency: {
            type: String,
            default: 'USD'
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    parentRestaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
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

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant; 