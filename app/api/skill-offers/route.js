import dbConnect from '@/lib/dbConnect';
import SkillOffer from '@/models/SkillOffer';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request) {
    try {
        await dbConnect();
        const url = new URL(request.url);
        const month = url.searchParams.get('month');
        const year = url.searchParams.get('year');
        const filter = {};
        // if month/year provided, filter by them; otherwise return all global offers
        if (month) filter.month = month;
        if (year) filter.year = year;
        const items = await SkillOffer.find(filter).sort({ skill: 1 }).lean();
        const data = items.map(s => ({ ...s, id: s._id.toString() }));
        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('GET /api/skill-offers error:', err);
        return NextResponse.json({ success: false, message: 'خطا در دریافت لیست رشته‌ها', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const body = await request.json();
        const { month, year, skill } = body;
        if (!skill) return NextResponse.json({ success: false, message: 'skill required' }, { status: 400 });
        // create global offer (month/year optional)
        const item = await SkillOffer.create({ month: month || undefined, year: year || undefined, skill });
        return NextResponse.json({ success: true, data: item }, { status: 201 });
    } catch (err) {
        console.error('POST /api/skill-offers error:', err);
        return NextResponse.json({ success: false, message: 'خطا در ایجاد رشته', error: err?.message || String(err) }, { status: 500 });
    }
}
