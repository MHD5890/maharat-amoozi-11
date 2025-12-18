import dbConnect from '@/lib/dbConnect';
import SkillOffer from '@/models/SkillOffer';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import mongoose from 'mongoose';

export async function DELETE(request, { params }) {
    try {
        console.log('DELETE /api/skill-offers/[id] params.id:', params.id);
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;
        await dbConnect();
        const { id } = await params;
        let item;
        if (mongoose.Types.ObjectId.isValid(id)) {
            item = await SkillOffer.findByIdAndDelete(id);
        } else {
            const itemBySkill = await SkillOffer.findOne({ skill: id });
            if (itemBySkill) {
                item = await SkillOffer.findByIdAndDelete(itemBySkill._id);
            }
        }
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
        const { id } = params;
        let item;
        if (mongoose.Types.ObjectId.isValid(id)) {
            item = await SkillOffer.findById(id);
        } else {
            item = await SkillOffer.findOne({ skill: id });
        }
        if (!item) return NextResponse.json({ success: false, message: 'یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, data: item });
    } catch (err) {
        console.error('GET /api/skill-offers/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        console.log('PUT /api/skill-offers/[id] params.id:', params.id);
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { month, year, skill } = body;
        if (!month && !year && !skill) return NextResponse.json({ success: false, message: 'no fields to update' }, { status: 400 });

        let currentItem;
        if (mongoose.Types.ObjectId.isValid(id)) {
            currentItem = await SkillOffer.findById(id);
        } else {
            currentItem = await SkillOffer.findOne({ skill: id });
        }
        if (!currentItem) return NextResponse.json({ success: false, message: 'یافت نشد' }, { status: 404 });

        const update = {};
        if (month !== undefined) update.month = month;
        if (year !== undefined) update.year = year;
        if (skill !== undefined) {
            if (currentItem.skill !== skill) {
                const existingSkill = await SkillOffer.findOne({ skill });
                if (existingSkill) {
                    return NextResponse.json({ success: false, message: 'رشته تکراری است' }, { status: 400 });
                }
            }
            update.skill = skill;
        }

        const item = await SkillOffer.findByIdAndUpdate(currentItem._id, update, { new: true, runValidators: true });
        if (!item) return NextResponse.json({ success: false, message: 'یافت نشد' }, { status: 404 });
        return NextResponse.json({ success: true, data: item });
    } catch (err) {
        console.error('PUT /api/skill-offers/[id] error:', err);
        return NextResponse.json({ success: false, message: 'در بروزرسانی', error: err?.message || String(err) }, { status: 500 });
    }
}
