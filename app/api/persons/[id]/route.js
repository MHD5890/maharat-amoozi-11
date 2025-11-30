import dbConnect from '@/lib/dbConnect';
import Person from '@/models/Person';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin'; // تابع چک ادمین
import sharp from 'sharp';

// GET a single person by ID (فقط مدیر)
export async function GET(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const url = new URL(request.url);
        const photo = url.searchParams.get('photo');

        if (photo === 'true') {
            // Serve photo
            const person = await Person.findById((await params).id).select('photo');
            if (!person || !person.photo) {
                return new NextResponse(null, { status: 404 });
            }
            return new NextResponse(person.photo, {
                status: 200,
                headers: {
                    'Content-Type': 'image/jpeg',
                    'Cache-Control': 'public, max-age=3600',
                },
            });
        }

        const person = await Person.findById((await params).id);

        if (!person) {
            return NextResponse.json({ success: false, message: "کاربر پیدا نشد" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: person });
    } catch (err) {
        console.error('GET /api/persons/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در بازیابی کاربر', error: err?.message || String(err) }, { status: 500 });
    }
}

// UPDATE a person by ID (فقط مدیر)
export async function PUT(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();

        let body = {};

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // Full update with formData
            const formData = await request.formData();
            for (const [key, value] of formData.entries()) {
                if (key === 'photo') {
                    // فایل عکس
                    const file = value;
                    if (file && file.size > 0) {
                        const arrayBuffer = await file.arrayBuffer();
                        let photoBuffer = Buffer.from(arrayBuffer);
                        // اگر حجم بیشتر از 200KB بود، فشرده کن
                        if (photoBuffer.length > 204800) {
                            photoBuffer = await sharp(photoBuffer)
                                .jpeg({ quality: 80 })
                                .toBuffer();
                            // اگر هنوز بزرگ بود، کیفیت کمتر
                            if (photoBuffer.length > 204800) {
                                photoBuffer = await sharp(photoBuffer)
                                    .jpeg({ quality: 60 })
                                    .toBuffer();
                            }
                            // اگر هنوز، کیفیت 40
                            if (photoBuffer.length > 204800) {
                                photoBuffer = await sharp(photoBuffer)
                                    .jpeg({ quality: 40 })
                                    .toBuffer();
                            }
                        }
                        body.photo = photoBuffer;
                    }
                } else if (key === 'deletePhoto' && value === 'true' && !body.photo) {
                    body.photo = null;
                } else {
                    body[key] = value;
                }
            }
        } else {
            // Partial update with URLSearchParams or JSON
            const text = await request.text();
            if (contentType.includes('application/json')) {
                body = JSON.parse(text);
            } else {
                // URLSearchParams
                const params = new URLSearchParams(text);
                for (const [key, value] of params.entries()) {
                    body[key] = value;
                }
            }
        }

        const person = await Person.findByIdAndUpdate((await params).id, body, { new: true, runValidators: true });

        if (!person) {
            return NextResponse.json({ success: false, message: "کاربر پیدا نشد" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: person });
    } catch (err) {
        console.error('PUT /api/persons/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در به‌روزرسانی کاربر', error: err?.message || String(err) }, { status: 500 });
    }
}

// DELETE a person by ID (فقط مدیر)
export async function DELETE(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const person = await Person.findByIdAndDelete((await params).id);

        if (!person) {
            return NextResponse.json({ success: false, message: "کاربر پیدا نشد" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "رکورد حذف شد" });
    } catch (err) {
        console.error('DELETE /api/persons/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در حذف کاربر', error: err?.message || String(err) }, { status: 500 });
    }
}
