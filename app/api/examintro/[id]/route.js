import dbConnect from '@/lib/dbConnect';
import ExamIntro from '@/models/ExamIntro';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';

function normalizeDigits(str) {
    return str.replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728));
}

function toPersianDigits(str) {
    return str.replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 1728));
}

export async function GET(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const { id } = await params;
        const item = await ExamIntro.findOne({ nationalId: id });
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
        const { id } = await params;
        const body = await request.json();
        const { status, examDate, paid } = body;
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (examDate !== undefined) updateData.examDate = examDate;
        if (paid !== undefined) updateData.paid = paid;
        const item = await ExamIntro.findOneAndUpdate({ nationalId: id }, updateData, { new: true });
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
        const { id } = await params;
        const item = await ExamIntro.findOneAndDelete({ nationalId: id });
        if (!item) return NextResponse.json({ success: false, message: 'یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'حذف شد' });
    } catch (err) {
        console.error('DELETE /api/examintro/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در حذف', error: err?.message || String(err) }, { status: 500 });
    }
}
