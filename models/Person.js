import mongoose from 'mongoose';

const PersonSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    nationalId: {
        type: String,
        required: true,
        unique: true,
        match: /^[0-9]{10}$/  // فقط ۱۰ رقم
    },
    fatherName: { type: String },
    birthDate: { type: String, required: true },
    phone: { type: String },
    city: { type: String }, // محل سکونت
    education: { type: String, required: true },
    fieldOfStudy: { type: String, required: true }, // رشته تحصیلی
    placeOfService: { type: String },
    maritalStatus: { type: String, required: true },
    skill1: { type: String, required: true },
    skill2: { type: String },
    skill3: { type: String },
    skillField: { type: String }, // انتخاب شده

    skillHistory: { type: String }, // سوابق مهارتی
    // اضافه: درخواست خوابگاه
    requestDormitory: { type: Boolean, default: false },
    // اضافه: طرح مهتا
    isMehtaPlan: { type: Boolean, default: false },
    serviceEndMonth: { type: String },
    serviceEndYear: { type: String },
    // اضافه: گواهی فنی حرفه ای
    hasCertificate: { type: Boolean, default: false },
    certificateName: { type: String },
    // تاریخ اعزام، تاریخ ثبت نام و وضعیت/اطلاعات آزمون
    dispatchDate: { type: String },
    registrationDate: { type: String },
    status: { type: String, default: 'در انتظار تایید' },
    examDate: { type: String },
    examTime: { type: String },
    courseCode: { type: String },
    courseMonth: { type: String }, // ماه دوره
    courseYear: { type: String }, // سال دوره
    photo: { type: Buffer }, // عکس به صورت باینری
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

PersonSchema.virtual('hasPhoto').get(function () {
    return !!this.photo && this.photo.length > 0;
});

// نکته مهم: سومین پارامتر "person" باعث میشه دقیقا توی کالکشن person ذخیره کنه
export default mongoose.models.Person || mongoose.model("Person", PersonSchema, "person");
