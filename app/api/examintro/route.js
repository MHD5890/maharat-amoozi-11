import dbConnect from '@/lib/dbConnect';
import ExamIntro from '@/models/ExamIntro';
import Person from '@/models/Person';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const nationalId = url.searchParams.get('nationalId');

        if (nationalId) {
            // Public access for tracking
            await dbConnect();
            let item = await ExamIntro.findOne({ nationalId, status: 'معرفی شده' });
            if (!item) {
                // Check Person model for registered persons with exam date
                item = await Person.findOne({ nationalId, status: 'معرفی به آزمون شده', examDate: { $exists: true, $ne: '' } });
            }
            if (item) {
                return NextResponse.json({ success: true, data: item });
            } else {
                return NextResponse.json({ success: false, message: 'هنوز به آزمون معرفی نشده اید' });
            }
        } else {
            // Admin access for list
            const notAllowed = checkAdmin(request);
            if (notAllowed) return notAllowed;

            await dbConnect();
            const items = await ExamIntro.find({}).sort({ createdAt: 1 });
            console.log('GET /api/examintro: Found', items.length, 'exam intro records');
            console.log('NationalIds:', items.map(i => i.nationalId));
            return NextResponse.json({ success: true, data: items });
        }
    } catch (err) {
        console.error('GET /api/examintro error:', err);
        return NextResponse.json({ success: false, message: 'خطا در دریافت لیست معرفی‌به‌آزمون', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Check if nationalId already exists in ExamIntro
        const existing = await ExamIntro.findOne({ nationalId: body.nationalId });
        if (existing) {
            return NextResponse.json({ success: false, message: 'کد ملی تکراری است. این کد ملی قبلاً برای معرفی به آزمون ثبت شده است.' }, { status: 400 });
        }

        const item = await ExamIntro.create({
            ...body,
            registrationDate: new Date().toLocaleDateString('fa-IR')
        });
        return NextResponse.json({ success: true, data: item }, { status: 201 });
    } catch (err) {
        console.error('POST /api/examintro error:', err);
        return NextResponse.json({ success: false, message: 'خطا در ثبت معرفی به آزمون', error: err?.message || String(err) }, { status: 500 });
    }
}
