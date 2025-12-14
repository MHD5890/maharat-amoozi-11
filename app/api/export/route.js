import dbConnect from '@/lib/dbConnect';
import Person from '@/models/Person';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import archiver from 'archiver';
import { checkAdmin } from '@/lib/checkAdmin'; // افزودن چک ادمین

export async function GET(request) {
    try {
        const notAllowed = checkAdmin(request);  // چک ادمین
        if (notAllowed) return notAllowed;

        await dbConnect();
        const url = new URL(request.url);
        const type = url.searchParams.get('type'); // 'zip' for photos
        const month = url.searchParams.get('month'); // '07'
        const year = url.searchParams.get('year'); // '1403'
        const skill = url.searchParams.get('skill')?.trim();
        const filter = url.searchParams.get('filter')?.trim(); // 'mehta' for mehta plan
        const tab = url.searchParams.get('tab')?.trim(); // 'persons', 'exam', 'mehta'

        if (type === 'zip') {
            // export photos as zip
            const queryFilter = { photo: { $exists: true, $ne: null } };
            if (skill) queryFilter.skillField = new RegExp(`^${skill}$`, 'i');
            if (month && year) {
                const regex = new RegExp(`^${year}\\/0?${parseInt(month, 10)}$`);
                queryFilter.dispatchDate = { $regex: regex };
            }
            if (filter === 'mehta') queryFilter.isMehtaPlan = true;
            if (tab === 'exam') queryFilter.status = { $in: ['معرفی به آزمون شده', 'ثبت نام شده'] };
            if (tab === 'mehta') queryFilter.isMehtaPlan = true;
            const persons = await Person.find(queryFilter).select('nationalId photo').sort({ createdAt: 1 });

            const archive = archiver('zip', { zlib: { level: 9 } });
            const chunks = [];
            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => { });

            for (const person of persons) {
                if (person.photo) {
                    archive.append(person.photo, { name: `${person.nationalId}.jpg` });
                }
            }
            await archive.finalize();

            const buffer = Buffer.concat(chunks);
            const sanitizedFilename = skill ? skill.replace(/\s+/g, '_').replace(/[\/\\?*\[\]:'"]/g, '_').substring(0, 100) : 'photos';
            return new NextResponse(buffer, {
                status: 200,
                headers: {
                    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(sanitizedFilename)}.zip`,
                    'Content-Type': 'application/zip',
                },
            });
        }

        const queryFilter = {};
        if (skill) queryFilter.skillField = new RegExp(`^${skill}$`, 'i');
        if (month && year) {
            // dispatchDate stored as 'YYYY/MM' or similar; match prefix
            const regex = new RegExp(`^${year}\\/0?${parseInt(month, 10)}$`);
            queryFilter.dispatchDate = { $regex: regex };
        }
        if (filter === 'mehta') queryFilter.isMehtaPlan = true;
        if (tab === 'exam') queryFilter.status = { $in: ['معرفی به آزمون شده', 'ثبت نام شده'] };
        if (tab === 'mehta') queryFilter.isMehtaPlan = true;
        const persons = await Person.find(queryFilter).sort({ createdAt: 1 }).lean();

        // نقشه‌برداری اعداد محل خدمت به نام‌ها
        const locationMap = {
            "1": "کارت سبز ( تکمیلی )",
            "2": "آموزش سپاه ثارالله",
            "3": "سپاه ثارالله",
            "4": "لشکر 41 ثارالله",
            "5": "فاوا قدس",
            "6": "آمادگاه شهید باهنر",
            "7": "تیپ 38 ذوالفقار",
            "8": "تیپ تکاور صاحب الزمان سیرجان",
            "9": "گروه موشکی و توپخانه 65 صاعقه رفسنجان",
            "10": "گروه امام حسین",
            "11": "سایر",
            "12": "خانواده کارکنان",
        };

        // تبدیل داده‌ها به فرمت مناسب برای اکسل
        const dataForExcel = persons.map((p, index) => {
            let dateStr = '';
            if (p.createdAt) {
                let date;
                if (typeof p.createdAt === 'string') {
                    date = new Date(p.createdAt);
                } else if (p.createdAt instanceof Date) {
                    date = p.createdAt;
                } else {
                    dateStr = '';
                }
                if (date && !isNaN(date.getTime())) {
                    dateStr = date.toLocaleDateString('en-US');
                }
            }
            return {
                'ردیف': index + 1,
                'نام': p.firstName || '',
                'نام خانوادگی': p.lastName || '',
                'نام پدر': p.fatherName || '',
                'کد ملی': p.nationalId || '',
                'تاریخ تولد': p.birthDate || '',
                'شماره تماس': p.phone || '',
                'تحصیلات': p.education || '',
                'محل سکونت': p.city || '',
                'محل خدمت': locationMap[p.placeOfService] || p.placeOfService || '',
                'رشته مهارت آموزی': p.skillField || '',
                'سوابق مهارتی': p.skillHistory || '',
                'وضعیت تاهل': p.maritalStatus || '',
                'درخواست خوابگاه': p.requestDormitory ? '*' : '',
                'طرح مهتا': p.isMehtaPlan ? '*' : '',
                'ماه و سال پایان خدمت': p.serviceEndMonth && p.serviceEndYear ? `${p.serviceEndMonth}/${p.serviceEndYear}` : '',
                'دارای گواهی فنی حرفه ای': p.hasCertificate ? '*' : '',
                'نام گواهی': p.certificateName || '',
                'تاریخ ثبت نام': dateStr,
                'تاریخ اعزام': p.dispatchDate || '',
                'وضعیت': p.status || '',
                'تاریخ آزمون': p.examDate || '',
                'عکس': p.photo ? 'دارد' : 'ندارد',
            };
        });

        const headers = ['ردیف', 'نام', 'نام خانوادگی', 'نام پدر', 'کد ملی', 'تاریخ تولد', 'شماره تماس', 'تحصیلات', 'محل سکونت', 'محل خدمت', 'رشته مهارت آموزی', 'سوابق مهارتی', 'وضعیت تاهل', 'درخواست خوابگاه', 'طرح مهتا', 'ماه و سال پایان خدمت', 'تاریخ ثبت نام', 'تاریخ اعزام', 'وضعیت', 'تاریخ آزمون', 'عکس'];
        const worksheet = XLSX.utils.json_to_sheet(dataForExcel, { header: headers });
        const workbook = XLSX.utils.book_new();
        const sheetName = 'Data';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // ایجاد بافر از فایل اکسل (به عنوان Buffer برای ارسال باینری)
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        const sanitizedFilename = skill ? skill.replace(/\s+/g, '_').replace(/[\/\\?*\[\]:'"]/g, '_').substring(0, 100) : 'registered_users';
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(sanitizedFilename)}.xlsx`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (err) {
        console.error('GET /api/export error:', err);
        return NextResponse.json({ success: false, message: 'خطا در تولید فایل اکسل', error: err?.message || String(err) }, { status: 500 });
    }
}
