import dbConnect from '@/lib/dbConnect';
import Announcement from '@/models/Announcement';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import fs from 'fs';
import path from 'path';

export async function PUT(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const { id } = await params;
        const formData = await request.formData();
        const title = formData.get('title');
        const content = formData.get('content');
        const image = formData.get('image');

        if (!title || !content) {
            return NextResponse.json({ success: false, message: 'عنوان و محتوا الزامی است' }, { status: 400 });
        }

        let updateData = { title, content, updatedAt: new Date() };
        if (image) {
            const buffer = await image.arrayBuffer();
            const filename = Date.now() + '-' + image.name;
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const filepath = path.join(uploadsDir, filename);
            fs.writeFileSync(filepath, Buffer.from(buffer));
            updateData.imageUrl = '/uploads/' + filename;
        }

        const item = await Announcement.findByIdAndUpdate(id, updateData, { new: true });
        if (!item) {
            return NextResponse.json({ success: false, message: 'اطلاعیه یافت نشد' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: item });
    } catch (err) {
        console.error('PUT /api/announcements/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در بروزرسانی اطلاعیه', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const { id } = await params;
        const item = await Announcement.findByIdAndDelete(id);
        if (!item) {
            return NextResponse.json({ success: false, message: 'اطلاعیه یافت نشد' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'اطلاعیه حذف شد' });
    } catch (err) {
        console.error('DELETE /api/announcements/[id] error:', err);
        return NextResponse.json({ success: false, message: 'خطا در حذف اطلاعیه', error: err?.message || String(err) }, { status: 500 });
    }
}
