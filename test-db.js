import dbConnect from './lib/dbConnect.js';
import Person from './models/Person.js';

async function testDB() {
    try {
        await dbConnect();
        console.log('Connected to database');

        const count = await Person.countDocuments({});
        console.log('Total persons:', count);

        const sample = await Person.find({}).limit(1).lean();
        console.log('Sample person:', sample[0] ? Object.keys(sample[0]) : 'No records');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

testDB();
