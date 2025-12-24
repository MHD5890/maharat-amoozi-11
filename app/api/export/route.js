import dbConnect from '@/lib/dbConnect';
import Person from '@/models/Person';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import archiver from 'archiver';
import { checkAdmin } from '@/lib/checkAdmin';

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function convertPersianToEnglishDigits(str) {
    if (!str) return str;
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const englishDigits = '0123456789';
    return str.replace(/[۰-۹]/g, (char) => englishDigits[persianDigits.indexOf(char)]);
}

export async function GET(request) {
    try {
        const notAllowed = checkAdmin(request);
        if (notAllowed) {
            return notAllowed;
        }

        await dbConnect();
        const url = new URL(request.url);
        const type = url.searchParams.get('type'); // 'zip' for photos
        const skill = url.searchParams.get('skill')?.trim();
        const filter = url.searchParams.get('filter')?.trim(); // 'mehta'
        const tab = url.searchParams.get('tab')?.trim(); // 'persons', 'exam', 'mehta'

        const queryFilter = {};
        if (skill) queryFilter.skillField = new RegExp(`^${escapeRegex(skill)}$`, 'i');

        if (tab === 'mehta' || filter === 'mehta') {
            queryFilter.isMehtaPlan = true;
        } else if (tab === 'persons') {
            queryFilter.isMehtaPlan = { $ne: true };
        } else if (tab === 'exam') {
            queryFilter.status = { $in: ['معرفی به آزمون شده', 'ثبت نام شده'] };
        }

        if (type === 'zip') {
            try {
                queryFilter.photo = { $exists: true, $ne: null };
                // Using lean() and selecting only needed fields for performance
                const persons = await Person.find(queryFilter).select('nationalId photo');

                if (persons.length === 0) {
                    return NextResponse.json({ success: false, message: 'هیچ عکسی برای خروجی یافت نشد' }, { status: 404 });
                }

                const archive = archiver('zip', { zlib: { level: 5 } }); // Faster compression

                const buffer = await new Promise((resolve, reject) => {
                    const chunks = [];
                    archive.on('data', (chunk) => chunks.push(chunk));
                    archive.on('end', () => resolve(Buffer.concat(chunks)));
                    archive.on('error', reject);

                    let photoCount = 0;
                    for (const person of persons) {
                        if (person.photo) {
                            console.log(`Photo for ${person.nationalId}:`, typeof person.photo, person.photo.constructor?.name, person.photo.length);
                            // Use the same logic as the working test script
                            const photoData = person.photo.buffer || person.photo;

                            if (Buffer.isBuffer(photoData) && photoData.length > 0) {
                                archive.append(photoData, { name: `${person.nationalId}.jpg` });
                                photoCount++;
                            } else {
                                console.log(`Invalid photo for ${person.nationalId}:`, typeof photoData, photoData?.length);
                            }
                        } else {
                            console.log(`No photo for ${person.nationalId}`);
                        }
                    }
                    console.log(`Total photos processed: ${photoCount} out of ${persons.length}`);
                    archive.finalize();
                });

                const sanitizedFilename = skill ? skill.replace(/\s+/g, '_').replace(/[\/\\?*\[\]:'"]/g, '_').substring(0, 100) : 'photos';
                return new NextResponse(buffer, {
                    status: 200,
                    headers: {
                        'Content-Disposition': `attachment; filename="${encodeURIComponent(sanitizedFilename)}.zip"`,
                        'Content-Type': 'application/zip',
                    },
                });
            } catch (err) {
                console.error('ZIP export error:', err);
                return NextResponse.json({ success: false, message: 'خطا در تولید فایل زیپ', error: err?.message || String(err) }, { status: 500 });
            }
        }

        // Export Excel - Use aggregation to check photo existence without loading photo data
        const persons = await Person.aggregate([
            { $match: queryFilter },
            {
                $addFields: {
                    photoExists: { $cond: { if: { $and: [{ $ne: ["$photo", null] }, { $gt: [{ $binarySize: "$photo" }, 0] }] }, then: true, else: false } }
                }
            },
            { $project: { photo: 0 } } // exclude photo to save memory
        ]);

        if (persons.length === 0) {
            return NextResponse.json({ success: false, message: 'هیچ رکوردی برای خروجی یافت نشد' }, { status: 404 });
        }

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

        const dataForExcel = persons.map((p, index) => ({
            'ردیف': index + 1,
            'نام': p.firstName || '',
            'نام خانوادگی': p.lastName || '',
            'نام پدر': p.fatherName || '',
            'کد ملی': convertPersianToEnglishDigits(p.nationalId || ''),
            'تاریخ تولد': convertPersianToEnglishDigits(p.birthDate || ''),
            'شماره تماس': convertPersianToEnglishDigits(p.phone || ''),
            'تحصیلات': p.education || '',
            'رشته تحصیلی': p.fieldOfStudy || '',
            'محل سکونت': p.city || '',
            'محل خدمت': locationMap[p.placeOfService] || p.placeOfService || '',
            'رشته مهارت آموزی': p.skillField || '',
            'اولویت ۲': p.skill2 || '',
            'اولویت ۳': p.skill3 || '',
            'سوابق مهارتی': p.skillHistory || '',
            'وضعیت تاهل': p.maritalStatus || '',
            'درخواست خوابگاه': p.requestDormitory ? '*' : '',
            'طرح مهتا': p.isMehtaPlan ? '*' : '',
            'ماه و سال پایان خدمت': `${p.serviceEndYear || ''}/${p.serviceEndMonth || ''}`.trim(),
            'تاریخ ثبت نام': convertPersianToEnglishDigits(p.registrationDate || ''),
            'تاریخ اعزام': convertPersianToEnglishDigits(p.dispatchDate || ''),
            'وضعیت': p.status || '',
            'تاریخ آزمون': convertPersianToEnglishDigits(p.examDate || ''),
            'عکس': p.photoExists ? '*' : '',
            'دارای گواهی فنی حرفه ای': p.hasCertificate ? '*' : '',
            'نام گواهی': p.certificateName || '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        const uint8 = new Uint8Array(buffer);

        const sanitizedFilename = skill ? skill.replace(/\s+/g, '_').replace(/[\/\\?*\[\]:'"]/g, '_').substring(0, 100) : 'persons';
        return new NextResponse(uint8, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${encodeURIComponent(sanitizedFilename)}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (err) {
        console.error('GET /api/export error:', err);
        return NextResponse.json({ success: false, message: 'خطا در تولید فایل اکسل', error: err?.message || String(err) }, { status: 500 });
    }
}
