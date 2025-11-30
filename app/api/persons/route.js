import dbConnect from '@/lib/dbConnect';
import Person from '@/models/Person';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin'; // تابع چک ادمین
import sharp from 'sharp';

// GET all persons (فقط مدیر دسترسی دارد)
export async function GET(request) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const persons = await Person.find({}).sort({ createdAt: 1 }).select('-photo');
        const personsWithPhoto = await Person.find({ photo: { $exists: true, $ne: null } }).select('_id');
        const photoIds = new Set(personsWithPhoto.map(p => p._id.toString()));
        const data = persons.map(p => {
            const obj = p.toObject();
            obj.hasPhoto = photoIds.has(p._id.toString());
            return obj;
        });
        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('GET /api/persons error:', err);
        return NextResponse.json({ success: false, message: 'خطا در دریافت لیست افراد', error: err?.message || String(err) }, { status: 500 });
    }
}

// CREATE a new person (ثبت‌نام عمومی - نیاز به ادمین ندارد)
export async function POST(request) {
    try {
        await dbConnect();
        const formData = await request.formData();

        const body = {};
        for (const [key, value] of formData.entries()) {
            if (key === 'photo') {
                // فایل عکس
                const file = value;
                if (file && file.size > 0) {
                    const arrayBuffer = await file.arrayBuffer();
                    let photoBuffer = Buffer.from(arrayBuffer);

                    // اگر حجم فایل بالای ۱ مگابایت باشد، فشرده‌سازی
                    if (file.size > 1024 * 1024) {
                        let processedBuffer = await sharp(photoBuffer).resize(800).jpeg({ quality: 80 }).toBuffer();
                        if (processedBuffer.length > 500 * 1024) {
                            processedBuffer = await sharp(photoBuffer).resize(600).jpeg({ quality: 70 }).toBuffer();
                        }
                        photoBuffer = processedBuffer;
                    }

                    body.photo = photoBuffer;
                }
            } else {
                body[key] = value;
            }
        }

        // جلوگیری از ثبت کد ملی تکراری
        const existing = await Person.findOne({ nationalId: body.nationalId });
        if (existing) {
            return NextResponse.json({ success: false, message: 'کد ملی تکراری است.' }, { status: 400 });
        }

        const person = await Person.create(body);
        return NextResponse.json({ success: true, data: person }, { status: 201 });
    } catch (err) {
        console.error('POST /api/persons error:', err);
        return NextResponse.json({ success: false, message: 'خطا در ثبت فرد', error: err?.message || String(err) }, { status: 500 });
    }
}
