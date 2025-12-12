const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
    try {
        const MONGODB_URI = "mongodb+srv://maharat:maharat123@cluster0.nj2zieq.mongodb.net/maharat?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Check nationalIds
async function checkNationalIds() {
    try {
        const db = mongoose.connection.db;
        const examIntros = await db.collection('examintro').find({}, { nationalId: 1 }).toArray();
        console.log('ExamIntro nationalIds:');
        examIntros.forEach((item, index) => {
            console.log(`${index + 1}: "${item.nationalId}" (length: ${item.nationalId.length}, type: ${typeof item.nationalId})`);
        });
    } catch (error) {
        console.error('Check error:', error);
    }
}

// Run the check
async function main() {
    await connectDB();
    await checkNationalIds();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

main().catch(console.error);
