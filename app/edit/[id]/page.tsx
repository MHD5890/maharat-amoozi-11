"use client";
// این فایل مشابه صفحه ثبت نام اصلی است با این تفاوت که اطلاعات را ابتدا دریافت و فرم را پر می‌کند
// برای جلوگیری از تکرار کد، می‌توانید یک کامپوننت فرم مشترک بسازید
// اما برای سادگی، ما کد را مستقیماً اینجا قرار می‌دهیم

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';

// === تعریف محل خدمت‌ها ===
const serviceLocations = [
    { value: "1", numeric: "1", detailed: "کارت سبز ( تکمیلی )" },
    { value: "2", numeric: "2", detailed: "آموزش سپاه ثارالله" },
    { value: "3", numeric: "3", detailed: "سپاه ثارالله" },
    { value: "4", numeric: "4", detailed: "لشکر 41 ثارالله" },
    { value: "5", numeric: "5", detailed: "فاوا قدس" },
    { value: "6", numeric: "6", detailed: "آمادگاه شهید باهنر" },
    { value: "7", numeric: "7", detailed: "تیپ 38 ذوالفقار" },
    { value: "8", numeric: "8", detailed: "تیپ تکاور صاحب الزمان سیرجان" },
    { value: "9", numeric: "9", detailed: "گروه موشکی و توپخانه 65 صاعقه رفسنجان" },
    { value: "10", numeric: "10", detailed: "گروه امام حسین" },
];

// === تعریف مهارت‌های موجود ===
const availableSkills = [
    "آموزشگاه رانندگی",
    "آموزشگاه کامپیوتر",
    "آموزشگاه برق",
    "آموزشگاه مکانیک",
    "آموزشگاه الکترونیک",
    "آموزشگاه جوشکاری",
    "آموزشگاه لوله کشی",
    "آموزشگاه نجاری",
    "آموزشگاه بنا",
    "آموزشگاه کشاورزی"
];

interface FormData {
    firstName?: string;
    lastName?: string;
    // ... بقیه فیلدها
}

export default function EditPage() {
    const [formData, setFormData] = useState<any>({});
    const [message, setMessage] = useState<string>('');
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    useEffect(() => {
        if (!id) return;
        const adminPass = sessionStorage.getItem('admin_pass');
        if (!adminPass) {
            window.location.href = '/login';
            return;
        }

        async function fetchPerson() {
            const res = await fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass || '')}`);
            const result = await res.json();
            if (result.success) {
                // جداسازی تاریخ تولد برای پر کردن select ها
                const [year, month, day] = result.data.birthDate.split('/');
                setFormData({ ...result.data, birthYear: year, birthMonth: month, birthDay: day });
            }
        }

        fetchPerson();
    }, [id]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage('در حال ذخیره تغییرات...');

        const birthDate = `${formData.birthYear}/${formData.birthMonth}/${formData.birthDay}`;
        const numericLocation = serviceLocations.find(l => l.detailed === formData.placeOfService)?.value || formData.placeOfService;
        const finalData = { ...formData, birthDate, placeOfService: numericLocation };

        const adminPass = sessionStorage.getItem('admin_pass');
        const response = await fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass || '')}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData),
        });

        const result = await response.json();
        if (result.success) {
            setMessage('تغییرات با موفقیت ذخیره شد.');
            setTimeout(() => router.push('/admin'), 1500);
        } else {
            setMessage('خطا در ذخیره تغییرات.');
        }
    };

    // JSX فرم ویرایش (فرم کامل مشابه ثبت نام اصلی با مقادیر اولیه)
    return (
        <main style={{ fontFamily: 'sans-serif', direction: 'rtl', padding: '20px' }}>
            <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
                <h2 style={{ textAlign: 'center' }}>ویرایش اطلاعات</h2>
                <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-y-2 gap-x-4" autoComplete="off">
                    <div className="field">
                        <label className="label">نام</label>
                        <input className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="firstName" value={formData.firstName || ''} onChange={handleChange} required />
                    </div>
                    <div className="field">
                        <label className="label">نام خانوادگی</label>
                        <input className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="lastName" value={formData.lastName || ''} onChange={handleChange} required />
                    </div>
                    <div className="field">
                        <label className="label">نام پدر</label>
                        <input className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} required />
                    </div>
                    <div className="field">
                        <label className="label">کد ملی</label>
                        <input className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="nationalId" value={formData.nationalId || ''} onChange={handleChange} pattern="[0-9]{10}" required />
                    </div>
                    <div className="field sm:col-span-2">
                        <label className="label">تاریخ تولد</label>
                        <div className="grid grid-cols-3 gap-2.5">
                            <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="birthDay" value={formData.birthDay || ''} onChange={handleChange} required><option value="" disabled>روز</option>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}</select>
                            <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="birthMonth" value={formData.birthMonth || ''} onChange={handleChange} required><option value="" disabled>ماه</option>{["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}</select>
                            <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="birthYear" value={formData.birthYear || ''} onChange={handleChange} required><option value="" disabled>سال</option>{Array.from({ length: 56 }, (_, i) => 1350 + i).reverse().map(y => <option key={y} value={y}>{y}</option>)}</select>
                        </div>
                    </div>
                    <div className="field">
                        <label className="label">شماره تماس</label>
                        <input className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="phone" value={formData.phone || ''} onChange={handleChange} type="tel" required />
                    </div>
                    <div className="field">
                        <label className="label">شهر محل سکونت</label>
                        <input className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="address" value={formData.address || ''} onChange={handleChange} required />
                    </div>
                    <div className="field sm:col-span-2">
                        <label className="label">تاریخ اعزام</label>
                        <div className="grid grid-cols-2 gap-2.5">
                            <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="dispatchMonth" value={formData.dispatchMonth || ''} onChange={handleChange} required><option value="">ماه</option>{["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}</select>
                            <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="dispatchYear" value={formData.dispatchYear || ''} onChange={handleChange} required><option value="">سال</option>{Array.from({ length: 5 }, (_, i) => 1400 + i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                        </div>
                    </div>
                    <div className="field">
                        <label className="label">مدرک تحصیلی</label>
                        <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="degree" value={formData.degree || 'دیپلم'} onChange={handleChange} required>
                            <option value="زیر دیپلم">زیر دیپلم</option><option value="دیپلم">دیپلم</option><option value="فوق دیپلم">فوق دیپلم</option>
                            <option value="لیسانس">لیسانس</option><option value="فوق لیسانس">فوق لیسانس</option><option value="دکتری">دکتری</option>
                        </select>
                    </div>
                    <div className="field">
                        <label className="label">رشته تحصیلی</label>
                        <input className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="fieldOfStudy" value={formData.fieldOfStudy || ''} onChange={handleChange} />
                    </div>
                    <div className="field">
                        <label className="label">محل خدمت</label>
                        <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="placeOfService" value={formData.placeOfService || ''} onChange={handleChange} required>
                            <option value="">انتخاب کنید</option>
                            {serviceLocations.map(location => (
                                <option key={location.value} value={location.value}>{location.detailed}</option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label className="label">وضعیت تأهل</label>
                        <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="marital" value={formData.marital || 'مجرد'} onChange={handleChange} required><option value="مجرد">مجرد</option><option value="متاهل">متاهل</option></select>
                    </div>
                    <div className="field sm:col-span-2">
                        <label className="label">اولویت‌های مهارت آموزی</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="skill1" value={formData.skill1 || ''} onChange={handleChange} required>
                                <option value="">اولویت ۱</option>
                                {availableSkills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                            </select>
                            <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="skill2" value={formData.skill2 || ''} onChange={handleChange}>
                                <option value="">اولویت ۲ (اختیاری)</option>
                                {availableSkills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                            </select>
                            <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="skill3" value={formData.skill3 || ''} onChange={handleChange}>
                                <option value="">اولویت ۳ (اختیاری)</option>
                                {availableSkills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="field">
                        <label className="label">درخواست خوابگاه</label>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="requestDormitory" checked={!!formData.requestDormitory} onChange={(e) => setFormData({ ...formData, requestDormitory: e.target.checked })} />
                            <span className="text-sm">درخواست خوابگاه دارم</span>
                        </div>
                    </div>
                    <div className="field">
                        <label className="label">طرح مهتا</label>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="isMehtaPlan" checked={!!formData.isMehtaPlan} onChange={(e) => setFormData({ ...formData, isMehtaPlan: e.target.checked })} />
                            <span className="text-sm">مشارکت در طرح مهتا</span>
                        </div>
                    </div>
                    {formData.isMehtaPlan && (
                        <div className="field sm:col-span-2">
                            <label className="label">تاریخ پایان خدمت</label>
                            <div className="grid grid-cols-2 gap-2.5">
                                <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="serviceEndMonth" value={formData.serviceEndMonth || ''} onChange={handleChange} required>
                                    <option value="">ماه</option>
                                    {["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                </select>
                                <select className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" name="serviceEndYear" value={formData.serviceEndYear || ''} onChange={handleChange} required>
                                    <option value="">سال</option>
                                    {[1403, 1404, 1405, 1406, 1407].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    <div className="actions sm:col-span-2">
                        <button className="w-3/5 min-w-[220px] bg-indigo-600 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-purple-700 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 animate-lift" type="submit">
                            ذخیره تغییرات
                        </button>
                    </div>
                </form>
                {message && (
                    <p className={`text-center mt-4 font-bold p-2.5 rounded-md ${message.includes('موفقیت') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </p>
                )}
            </div>
        </main>
    );
}
