import dbConnect from '@/lib/dbConnect';
import Announcement from '@/models/Announcement';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import fs from 'fs';
import path from 'path';


export async function GET(request) {
    try {
        await dbConnect();
        const items = await Announcement.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, data: items });
    } catch (err) {
        console.error('GET /api/announcements error:', err);
        return NextResponse.json({ success: false, message: 'خطا در دریافت اطلاعیه‌ها', error: err?.message || String(err) }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const formData = await request.formData();
        const title = formData.get('title');
        const content = formData.get('content');
        const image = formData.get('image');

        if (!title || !content) {
            return NextResponse.json({ success: false, message: 'عنوان و محتوا الزامی است' }, { status: 400 });
        }

        let imageUrl = null;
        if (image) {
            const buffer = await image.arrayBuffer();
            const filename = Date.now() + '-' + image.name;
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const filepath = path.join(uploadsDir, filename);
            fs.writeFileSync(filepath, Buffer.from(buffer));
            imageUrl = '/uploads/' + filename;
        }


        const item = await Announcement.create({ title, content, imageUrl });
        return NextResponse.json({ success: true, data: item }, { status: 201 });
    } catch (err) {
        console.error('POST /api/announcements error:', err);
        return NextResponse.json({ success: false, message: 'خطا در ایجاد اطلاعیه', error: err?.message || String(err) }, { status: 500 });
    }
}
