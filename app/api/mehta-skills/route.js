import dbConnect from '@/lib/dbConnect';
import MehtaSkill from '@/models/MehtaSkill';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request) {
    try {
        await dbConnect();
        const items = await MehtaSkill.find({}).sort({ createdAt: -1 }).lean();
        const data = items.map(s => ({ ...s, id: s._id.toString() }));
        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('GET /api/mehta-skills error:', err);
        return NextResponse.json({ success: false, message: 'خطا در دریافت رشته‌های مهتا', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const { skill } = await request.json();
        if (!skill) return NextResponse.json({ success: false, message: 'skill required' }, { status: 400 });

        // Check if skill already exists
        const existingSkill = await MehtaSkill.findOne({ skill });
        if (existingSkill) {
            return NextResponse.json({ success: false, message: 'رشته مهتا از قبل وجود دارد' }, { status: 400 });
        }

        const item = await MehtaSkill.create({ skill });
        return NextResponse.json({ success: true, data: item }, { status: 201 });
    } catch (err) {
        console.error('POST /api/mehta-skills error:', err);
        return NextResponse.json({ success: false, message: 'خطا در ایجاد رشته مهتا', error: err?.message || String(err) }, { status: 500 });
    }
}
