
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://maharat:maharat123@cluster0.nj2zieq.mongodb.net/maharat?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
    await mongoose.connect(MONGODB_URI);
    const count = await mongoose.connection.collection('person').countDocuments();
    console.log('Total persons:', count);
    const withPhoto = await mongoose.connection.collection('person').countDocuments({ photo: { $exists: true, $ne: null } });
    console.log('Persons with photo:', withPhoto);
    
    // Average photo size
    const samples = await mongoose.connection.collection('person').find({ photo: { $exists: true, $ne: null } }).limit(10).toArray();
    let totalSize = 0;
    samples.forEach(s => {
        if (s.photo) totalSize += (s.photo.buffer || s.photo).length;
    });
    console.log('Average photo size (of 10):', (totalSize / 10 / 1024).toFixed(2), 'KB');
    
    process.exit(0);
}
run();
