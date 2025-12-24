
const mongoose = require('mongoose');
const fs = require('fs');
const XLSX = require('xlsx');
const archiver = require('archiver');

const MONGODB_URI = "mongodb+srv://maharat:maharat123@cluster0.nj2zieq.mongodb.net/maharat?retryWrites=true&w=majority&appName=Cluster0";

const PersonSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    nationalId: String,
    photo: Buffer,
    isMehtaPlan: Boolean,
    skillField: String,
    status: String,
});

const Person = mongoose.models.Person || mongoose.model("Person", PersonSchema, "person");

async function test() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Test Excel Data
        const persons = await Person.find({}).lean().limit(5);
        console.log('Found persons for excel:', persons.length);
        if (persons.length > 0) {
            const dataForExcel = persons.map((p, index) => ({
                'ردیف': index + 1,
                'نام': p.firstName || '',
                'کد ملی': p.nationalId || '',
            }));
            const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
            fs.writeFileSync('test_export_debug.xlsx', buffer);
            console.log('Excel test file written');
        }

        // Test ZIP
        const personsWithPhoto = await Person.find({ photo: { $exists: true, $ne: null } }).select('nationalId photo').lean().limit(2);
        console.log('Found persons with photo:', personsWithPhoto.length);
        if (personsWithPhoto.length > 0) {
            const output = fs.createWriteStream('test_photos_debug.zip');
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.pipe(output);
            for (const p of personsWithPhoto) {
                const photoData = p.photo.buffer || p.photo;
                archive.append(photoData, { name: `${p.nationalId}.jpg` });
            }
            await archive.finalize();
            console.log('ZIP test file written');
        }

        process.exit(0);
    } catch (err) {
        console.error('Test error:', err);
        process.exit(1);
    }
}

test();
