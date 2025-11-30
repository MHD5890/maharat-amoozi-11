 import dbConnect from '@/lib/dbConnect';
import ExamIntro from '@/models/ExamIntro';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const item = await ExamIntro.findById(params.id);
        if (!item) return NextResponse.json({ success: false, message: 'یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, data: item });
    } catch (err) {
        console.error('GET /api/examintro/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const body = await request.formData();
        const status = body.get('status');
        const examDate = body.get('examDate');
        const updateData = {};
        if (status !== null) updateData.status = status;
        if (examDate !== null) updateData.examDate = examDate;
        const item = await ExamIntro.findByIdAndUpdate(params.id, updateData, { new: true });
        if (!item) return NextResponse.json({ success: false, message: 'یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, data: item });
    } catch (err) {
        console.error('PUT /api/examintro/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در بروزرسانی', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const item = await ExamIntro.findByIdAndDelete(params.id);
        if (!item) return NextResponse.json({ success: false, message: 'یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'حذف شد' });
    } catch (err) {
        console.error('DELETE /api/examintro/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در حذف', error: err?.message || String(err) }, { status: 500 });
    }
}
