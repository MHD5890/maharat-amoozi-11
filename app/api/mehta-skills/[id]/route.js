import dbConnect from '@/lib/dbConnect';
import MehtaSkill from '@/models/MehtaSkill';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import mongoose from 'mongoose';

export async function PUT(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const { id } = await params;
        console.log('PUT /api/mehta-skills/[id] id:', id);
        console.log('PUT /api/mehta-skills/[id] params:', params);
        const body = await request.json();
        const { skill } = body;
        if (!skill) return NextResponse.json({ success: false, message: 'skill required' }, { status: 400 });

        let currentItem;
        if (mongoose.Types.ObjectId.isValid(id)) {
            currentItem = await MehtaSkill.findById(id);
        } else {
            currentItem = await MehtaSkill.findOne({ skill: id });
        }
        console.log('PUT currentItem:', currentItem);
        if (!currentItem) return NextResponse.json({ success: false, message: `رشته یافت نشد - ID: ${id}` }, { status: 404 });

        if (currentItem.skill !== skill) {
            const existingSkill = await MehtaSkill.findOne({ skill });
            if (existingSkill) {
                return NextResponse.json({ success: false, message: 'رشته مهتا از قبل وجود دارد' }, { status: 400 });
            }
        }

        const item = await MehtaSkill.findByIdAndUpdate(currentItem._id, { skill }, { new: true, runValidators: true });
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
        const { id } = await params;
        console.log('DELETE /api/mehta-skills/[id] id:', id, 'isValidObjectId:', mongoose.Types.ObjectId.isValid(id));
        console.log('DELETE /api/mehta-skills/[id] params:', params);
        let item;
        if (mongoose.Types.ObjectId.isValid(id)) {
            item = await MehtaSkill.findByIdAndDelete(id);
        } else {
            const itemBySkill = await MehtaSkill.findOne({ skill: id });
            if (itemBySkill) {
                item = await MehtaSkill.findByIdAndDelete(itemBySkill._id);
            }
        }
        console.log('DELETE item:', item);
        if (!item) {
            return NextResponse.json({ success: false, message: `رشته یافت نشد - ID: ${id}` }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'رشته حذف شد' });
    } catch (err) {
        console.error('DELETE /api/mehta-skills/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در حذف رشته مهتا', error: err?.message || String(err) }, { status: 500 });
    }
}
