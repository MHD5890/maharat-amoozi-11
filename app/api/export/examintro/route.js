import dbConnect from '@/lib/dbConnect';
import ExamIntro from '@/models/ExamIntro';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) return notAllowed;

        await dbConnect();
        const items = await ExamIntro.find({}).sort({ createdAt: 1 }).lean();

        const dataForExcel = items.map((it, index) => ({
            'ردیف': index + 1,
            'نام': it.firstName,
            'نام خانوادگی': it.lastName,
            'کد ملی': it.nationalId,
            'شماره تماس': it.phone,
            'رشته مهارت آموزی': it.skillField,
            'ماه و سال دوره': it.courseMonth && it.courseYear ? `${it.courseMonth}/${it.courseYear}` : '',
            'تاریخ ثبت نام': it.registrationDate || (it.createdAt ? new Date(it.createdAt).toLocaleDateString('fa-IR') : ''),
            'وضعیت': it.status,
            'تاریخ آزمون': it.examDate,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'معرفی‌به‌آزمون');

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        const uint8 = new Uint8Array(buffer);

        return new NextResponse(uint8, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="exam_intros.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (err) {
        console.error('GET /api/export/examintro error:', err);
        return NextResponse.json({ success: false, message: 'خطا در تولید فایل اکسل معرفی به آزمون', error: err?.message || String(err) }, { status: 500 });
    }
}
