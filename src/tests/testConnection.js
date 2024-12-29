const { connectToDatabase } = require('../database/connection');
const { Restaurant, User } = require('../models');

async function testDatabaseConnection() {
    try {
        console.log('Testing database connection...');
        
        // Connect to database
        await connectToDatabase();
        console.log('✓ Database connected successfully');

        // Test creating a restaurant
        const testRestaurant = new Restaurant({
            name: 'Test Restaurant',
            location: {
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345'
            }
        });

        await testRestaurant.save();
        console.log('✓ Test restaurant created successfully');

        // Test creating a user
        const testUser = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpassword123',
            restaurants: [testRestaurant._id]
        });

        await testUser.save();
        console.log('✓ Test user created successfully');

        // Test fetching user with populated restaurant
        const fetchedUser = await User.findById(testUser._id).populate('restaurants');
        console.log('✓ User fetched with restaurant:', fetchedUser.username);

        // Clean up test data
        await Restaurant.deleteOne({ _id: testRestaurant._id });
        await User.deleteOne({ _id: testUser._id });
        console.log('✓ Test data cleaned up successfully');

        console.log('\nAll tests passed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during database test:', error);
        process.exit(1);
    }
}

testDatabaseConnection(); 