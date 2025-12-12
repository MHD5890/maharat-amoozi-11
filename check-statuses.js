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

// Check statuses
async function checkStatuses() {
    try {
        const db = mongoose.connection.db;
        const persons = await db.collection('persons').find({}, { status: 1 }).toArray();
        const statuses = [...new Set(persons.map(p => p.status))];
        console.log('Statuses in Person collection:', statuses);
    } catch (error) {
        console.error('Check error:', error);
    }
}

// Run the check
async function main() {
    await connectDB();
    await checkStatuses();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

main().catch(console.error);
