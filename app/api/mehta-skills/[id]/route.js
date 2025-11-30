import dbConnect from '@/lib/dbConnect';
import MehtaSkill from '@/models/MehtaSkill';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';

export async function PUT(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const { id } = params;
        const body = await request.json();
        const { skill } = body;
        if (!skill) return NextResponse.json({ success: false, message: 'skill required' }, { status: 400 });
        const item = await MehtaSkill.findByIdAndUpdate(id, { skill }, { new: true });
        if (!item) return NextResponse.json({ success: false, message: 'رشته یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, data: item });
    } catch (err) {
        console.error('PUT /api/mehta-skills/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در بروزرسانی رشته مهتا', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const { id } = params;
        const item = await MehtaSkill.findByIdAndDelete(id);
        if (!item) return NextResponse.json({ success: false, message: 'رشته یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'رشته حذف شد' });
    } catch (err) {
        console.error('DELETE /api/mehta-skills/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در حذف رشته مهتا', error: err?.message || String(err) }, { status: 500 });
    }
}
