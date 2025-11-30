import dbConnect from '@/lib/dbConnect';
import SkillOffer from '@/models/SkillOffer';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';

export async function DELETE(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;
        await dbConnect();
        const item = await SkillOffer.findByIdAndDelete(params.id);
        if (!item) return NextResponse.json({ success: false, message: 'یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'حذف شد' });
    } catch (err) {
        console.error('DELETE /api/skill-offers/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در حذف', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const item = await SkillOffer.findById(params.id);
        if (!item) return NextResponse.json({ success: false, message: 'یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, data: item });
    } catch (err) {
        console.error('GET /api/skill-offers/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const body = await request.json();
        const { month, year, skill } = body;
        if (!month && !year && !skill) return NextResponse.json({ success: false, message: 'no fields to update' }, { status: 400 });
        const update = {};
        if (month !== undefined) update.month = month;
        if (year !== undefined) update.year = year;
        if (skill !== undefined) update.skill = skill;
        const item = await SkillOffer.findByIdAndUpdate(params.id, update, { new: true, runValidators: true });
        if (!item) return NextResponse.json({ success: false, message: '\u06cc\u0627\u0641\u062a \u0646\u0634\u062f' }, { status: 404 });
        return NextResponse.json({ success: true, data: item });
    } catch (err) {
        console.error('PUT /api/skill-offers/[id] error:', err);
        // handle duplicate key error
        if (err && err.code === 11000) {
            return NextResponse.json({ success: false, message: 'رشته تکراری است' }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: '\u062f\u0631 \u0628\u0631\u0631\u0633\u0627\u0646\u06cc', error: err?.message || String(err) }, { status: 500 });
    }
}
