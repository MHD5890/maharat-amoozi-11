import dbConnect from '@/lib/dbConnect';
import Person from '@/models/Person';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import limit from '@/lib/imageLimiter';

export async function POST(request) {
    await dbConnect();
    try {
        const formData = await request.formData();

        const body = {};
        for (const [key, value] of formData.entries()) {
            if (key === 'photo') {
                // فایل عکس
                const file = value;
                if (file && file.size > 0) {
                    const arrayBuffer = await file.arrayBuffer();
                    let photoBuffer = Buffer.from(arrayBuffer);
                    // اگر حجم بیشتر از 300KB بود، فشرده کن
                    if (photoBuffer.length > 307200) {
                        photoBuffer = await limit(async () => sharp(photoBuffer)
                            .limitInputPixels(50000000)
                            .jpeg({ quality: 50 })
                            .toBuffer());
                    }
                    body.photo = photoBuffer;
                }
            } else {
                body[key] = value;
            }
        }

        const person = await Person.create(body);
        return NextResponse.json({ success: true, data: person }, { status: 201 });
    } catch (error) {
        // بررسی خطای کد ملی تکراری
        if (error.code === 11000 && error.keyPattern?.nationalId) {
            return NextResponse.json({
                success: false,
                message: 'با این کد ملی قبلا ثبت نام کرده‌اید.'
            }, { status: 409 }); // 409 Conflict
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
