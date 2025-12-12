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

// Models
const PersonSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    nationalId: String,
    phone: String,
    skillField: String,
    courseMonth: String,
    courseYear: String,
    registrationDate: String,
    status: String,
    examDate: String,
    examCost: Number,
    paid: Boolean,
}, { timestamps: true });

const ExamIntroSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    nationalId: { type: String, required: true, match: /^[0-9]{10}$/ },
    phone: { type: String },
    skillField: { type: String },
    courseMonth: { type: String },
    courseYear: { type: String },
    registrationDate: { type: String },
    status: { type: String, default: 'معرفی نشده' },
    examDate: { type: String },
    examCost: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
}, { timestamps: true });

const Person = mongoose.models.Person || mongoose.model('Person', PersonSchema, 'persons');
const ExamIntro = mongoose.models.ExamIntro || mongoose.model('ExamIntro', ExamIntroSchema, 'examintro');

// Populate ExamIntro from Person
async function populateExamIntro() {
    try {
        const persons = await Person.find({ status: 'معرفی به آزمون شده' });
        console.log(`Found ${persons.length} persons with status 'معرفی به آزمون شده'`);

        for (const person of persons) {
            const existing = await ExamIntro.findOne({ nationalId: person.nationalId });
            if (!existing) {
                const examIntroData = {
                    firstName: person.firstName,
                    lastName: person.lastName,
                    nationalId: person.nationalId,
                    phone: person.phone,
                    skillField: person.skillField,
                    courseMonth: person.courseMonth,
                    courseYear: person.courseYear,
                    registrationDate: person.registrationDate,
                    status: 'معرفی نشده', // default
                    examDate: person.examDate,
                    examCost: person.examCost || 0,
                    paid: person.paid || false,
                };
                await ExamIntro.create(examIntroData);
                console.log(`Created ExamIntro for ${person.nationalId}`);
            } else {
                console.log(`ExamIntro already exists for ${person.nationalId}`);
            }
        }

        console.log('Population completed');
    } catch (error) {
        console.error('Population error:', error);
    }
}

// Run the population
async function main() {
    await connectDB();
    await populateExamIntro();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

main().catch(console.error);
