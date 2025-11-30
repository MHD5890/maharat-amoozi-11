import mongoose from 'mongoose';

const ExamIntroSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    nationalId: { type: String, required: true, match: /^[0-9]{10}$/ },
    phone: { type: String },
    skillField: { type: String },
    courseMonth: { type: String }, // e.g. '07' (شمسی)
    courseYear: { type: String }, // e.g. '1403'
    registrationDate: { type: String },
    status: { type: String, default: 'معرفی نشده' },
    examDate: { type: String },
}, { timestamps: true });

export default mongoose.models.ExamIntro || mongoose.model('ExamIntro', ExamIntroSchema, 'examinro');
