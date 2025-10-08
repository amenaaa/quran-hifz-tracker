const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quran-hifz';

console.log('🔍 Testing MongoDB Connection...\n');
console.log('Connection String:', MONGO_URI);
console.log('-----------------------------------\n');

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB!\n');
    return testDatabase();
})
.catch(err => {
    console.error('❌ ERROR: Could not connect to MongoDB');
    console.error('Error message:', err.message);
    console.error('\n📋 Troubleshooting Steps:');
    console.error('1. Make sure MongoDB is installed and running');
    console.error('2. Check if MongoDB service is active');
    console.error('3. Verify the connection string is correct\n');
    process.exit(1);
});

async function testDatabase() {
    try {
        console.log('🔄 Testing database operations...\n');
        
        const admin = mongoose.connection.db.admin();
        const info = await admin.serverInfo();
        
        console.log('📊 MongoDB Server Info:');
        console.log('   Version:', info.version);
        console.log('   Database:', mongoose.connection.name);
        console.log('   Host:', mongoose.connection.host);
        console.log('   Port:', mongoose.connection.port);
        console.log('\n✅ Database test completed successfully!\n');
        console.log('🎉 Your MongoDB connection is working perfectly!');
        console.log('💡 You can now run: npm start\n');
        
    } catch (err) {
        console.error('❌ Database test failed:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connection closed.');
        process.exit(0);
    }
}

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('\n👋 MongoDB connection closed');
    process.exit(0);
});