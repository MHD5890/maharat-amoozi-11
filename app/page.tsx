'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Search, UserPlus, Eye, EyeOff, Upload, CheckCircle, XCircle, Bell, Download } from 'lucide-react';
import toast from 'react-hot-toast';
// کتابخانه xlsx از طریق تگ script در layout.tsx بارگذاری می‌شود
declare const XLSX: any;

// === تعریف استایل‌های Tailwind به صورت ثابت ===
const inputStyle = "w-full border-2 border-gray-300 rounded-xl py-3 px-4 outline-none bg-white text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20";
const primaryBtnStyle = "w-3/5 min-w-[220px] bg-indigo-600 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-purple-700 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 animate-lift";
const secondaryBtnStyle = "inline-block bg-white text-slate-900 font-bold py-2.5 px-4 rounded-full self-center border-2 border-gray-200 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2";
const secondaryDarkBtnStyle = "bg-gray-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-gray-800 transition";
const excelBtnStyle = "bg-emerald-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-emerald-700 transition";
const editBtnStyle = "bg-sky-500 text-white font-bold py-1 px-3 rounded-md hover:bg-sky-700 transition mx-1";
const deleteBtnStyle = "bg-red-500 text-white font-bold py-1 px-3 rounded-md hover:bg-red-700 transition mx-1";
const tableInputStyle = "w-full p-1 rounded-md border border-gray-300 text-center text-xs disabled:bg-gray-100";

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
  { value: "11", numeric: "11", detailed: "سایر" },
  { value: "12", numeric: "12", detailed: " خانواده کارکنان " },
];

// === اینترفیس‌ها ===
interface FormData {
  firstName?: string; lastName?: string; fatherName?: string;
  nationalId?: string; birthDay?: string; birthMonth?: string;
  birthYear?: string; phone?: string; address?: string;
  degree?: string; skill1?: string; skill2?: string; skill3?: string; marital?: string;
  skillHistory?: string;
  dispatchMonth?: string; dispatchYear?: string;
  requestDormitory?: boolean;
  placeOfService?: string;
  photo?: File;
  isMehtaPlan?: boolean;
  customSkill?: string;
  serviceEndMonth?: string;
  serviceEndYear?: string;
  hasCertificate?: boolean;
  certificateName?: string;
}

interface Registration extends FormData {
  id: number;
  birthDate: string;
  dispatchDate?: string;
  registrationDate: string;
  status: 'ثبت نام نشده' | 'ثبت نام شده' | 'معرفی به آزمون شده';
  examDate?: string;
  examTime?: string;
  courseCode?: string;
  skill1: string;
  skill2?: string;
  skill3?: string;
}

// === تعریف پراپ‌ها ===
type RegisterFormProps = {
  onNavigate: (page: 'login' | 'admin' | 'register') => void;
  onSave: (user: Registration) => void;
  initialData?: Registration | null;
  isEditMode: boolean;
};

type AdminPageProps = {
  registrations: Registration[];
  onNavigate: (page: 'register') => void;
  onEdit: (user: Registration) => void;
  onDelete: (userId: number) => void;
  onUpdateRegistration: (userId: number, field: keyof Registration, value: string) => void;
};



// helper function to convert URLs in text to clickable links
const convertUrlsToLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
  return text.replace(urlRegex, (url) => {
    let href = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      href = 'https://' + url;
    }
    return `<br><a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">اینجا کلیک کنید</a>`;
  });
};

// === کامپوننت فرم ثبت نام / ویرایش ===
const RegisterForm = ({ onNavigate, onSave, initialData, isEditMode }: RegisterFormProps) => {
  const [activeFormTab, setActiveFormTab] = useState<'register' | 'exam' | 'tracking' | 'results' | 'guidelines'>('register');
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', fatherName: '', nationalId: '',
    birthDay: '', birthMonth: '', birthYear: '', phone: '', address: '',
    degree: 'دیپلم', skill1: '', skill2: '', skill3: '', marital: 'مجرد',
    skillHistory: '',
    dispatchMonth: '', dispatchYear: '',
    requestDormitory: false,
    placeOfService: '',
    photo: undefined,
    isMehtaPlan: false,
    customSkill: '',
    serviceEndMonth: '',
    serviceEndYear: '',
  });
  const [deletePhoto, setDeletePhoto] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingNationalId, setTrackingNationalId] = useState<string>('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingMessage, setTrackingMessage] = useState<string>('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [mehtaSkills, setMehtaSkills] = useState<string[]>([]);
  const [regularSkills, setRegularSkills] = useState<string[]>([]);


  // load global skill offers once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/skill-offers');
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.success) {
          let skills = body.data.map((s: any) => s.skill);
          setRegularSkills(skills);
        } else setRegularSkills([]);
        const resMehta = await fetch('/api/mehta-skills');
        const bodyMehta = await resMehta.json().catch(() => ({}));
        if (resMehta.ok && bodyMehta.success) {
          let mehta = bodyMehta.data.map((s: any) => s.skill);
          setMehtaSkills(mehta);
        } else setMehtaSkills([]);
      } catch (e) { setRegularSkills([]); setMehtaSkills([]); }
    })();
  }, [isEditMode, initialData]);

  useEffect(() => {
    let skills = formData.isMehtaPlan ? mehtaSkills : regularSkills;
    if (isEditMode && initialData) {
      const personSkills = [initialData.skill1, initialData.skill2, initialData.skill3].filter((s): s is string => s !== undefined && !skills.includes(s));
      skills = [...skills, ...personSkills];
    }
    setAvailableSkills(skills);
  }, [formData.isMehtaPlan, mehtaSkills, regularSkills, isEditMode, initialData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/announcements');
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.success) {
          setAnnouncements(body.data);
        } else setAnnouncements([]);
      } catch (e) { setAnnouncements([]); }
    })();
  }, []);

  // helper to convert Persian digits to latin
  const persianToLatinDigits = (s: string) => s.replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)));

  const getCurrentPersianYearMonth = () => {
    try {
      const parts = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit' }); // e.g. '۱۴۰۳/۰۷'
      if (!parts) return { year: '', month: '' };
      const latin = persianToLatinDigits(parts).replace(/\u200f/g, '');
      const m = latin.match(/(\d{3,4}).*?(\d{1,2})/);
      if (!m) return { year: '', month: '' };
      return { year: m[1], month: m[2].padStart(2, '0') };
    } catch (e) { return { year: '', month: '' }; }
  };

  useEffect(() => {
    if (isEditMode && initialData) {
      const [year, month, day] = initialData.birthDate ? initialData.birthDate.split('/') : ['', '', ''];
      const [dispatchYear, dispatchMonth] = initialData.dispatchDate ? initialData.dispatchDate.split('/') : ['', ''];
      setFormData({ ...initialData, birthDay: day, birthMonth: month, birthYear: year, dispatchMonth, dispatchYear, skill1: initialData.skill1 || '', skill2: initialData.skill2 || '', skill3: initialData.skill3 || '', skillHistory: (initialData as any).skillHistory || '', requestDormitory: (initialData as any).requestDormitory || false, placeOfService: (initialData as any).placeOfService || '', isMehtaPlan: (initialData as any).isMehtaPlan || false, customSkill: (initialData as any).customSkill || '', serviceEndMonth: (initialData as any).serviceEndMonth || '', serviceEndYear: (initialData as any).serviceEndYear || '', hasCertificate: (initialData as any).hasCertificate || false, certificateName: (initialData as any).certificateName || '' });
      setDeletePhoto(false);
    }
  }, [initialData, isEditMode]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    let value: any;
    if (target.type === 'checkbox') {
      value = target.checked;
    } else if (target.type === 'file') {
      value = target.files?.[0];
    } else {
      value = target.value;
    }
    setFormData({ ...formData, [target.name]: value });
  };

  const handleTrackingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTrackingMessage('در حال بررسی...');
    setTrackingResult(null);
    try {
      const res = await fetch(`/api/examintro?nationalId=${trackingNationalId}`);
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setTrackingResult(body.data);
        setTrackingMessage('');
        toast.success('اطلاعات با موفقیت یافت شد!');
      } else {
        setTrackingMessage(body.message || 'خطا در بررسی');
        toast.error(body.message || 'خطا در بررسی');
      }
    } catch (err: any) {
      setTrackingMessage(err?.message || 'خطا در ارسال');
      toast.error(err?.message || 'خطا در ارسال');
    }
  };

  const handleCertificateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!certificateNationalId || !/^\d{10}$/.test(certificateNationalId)) {
      setCertificateMessage('کد ملی نامعتبر است');
      toast.error('کد ملی نامعتبر است');
      return;
    }
    setCertificateMessage('در حال دریافت مدرک...');
    setCertificateResult(null);
    try {
      const res = await fetch(`/api/certificate?nationalId=${certificateNationalId}`);
      const html = await res.text();
      if (res.ok) {
        setCertificateResult(html);
        setCertificateMessage('');
        toast.success('مدرک دریافت شد');
      } else {
        setCertificateMessage(html || 'خطا در دریافت مدرک');
        toast.error(html || 'خطا در دریافت مدرک');
      }
    } catch (err: any) {
      setCertificateMessage(err?.message || 'خطا در ارسال');
      toast.error(err?.message || 'خطا در ارسال');
    }
  };

  const handleResultsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setResultsMessage('در حال بررسی...');
    setResultsResult(null);
    try {
      const res = await fetch(`/api/results?nationalId=${resultsNationalId}`);
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setResultsResult(body.data);
        setResultsMessage('');
        toast.success('اطلاعات با موفقیت یافت شد!');
      } else {
        setResultsMessage(body.message || 'خطا در بررسی');
        toast.error(body.message || 'خطا در بررسی');
      }
    } catch (err: any) {
      setResultsMessage(err?.message || 'خطا در ارسال');
      toast.error(err?.message || 'خطا در ارسال');
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const actionText = isEditMode ? 'ویرایش' : 'ثبت نام';
    setMessage(`در حال ${actionText} اطلاعات...`);
    const birthDate = `${formData.birthYear}/${formData.birthMonth}/${formData.birthDay}`;
    const dispatchDate = `${formData.dispatchYear}/${formData.dispatchMonth}`;
    // build registrationDate using current Persian year/month and current day
    const todayDay = new Date().toLocaleDateString('fa-IR', { day: '2-digit' });
    const dayPart = todayDay || '01';
    const { year: regYear, month: regMonth } = getCurrentPersianYearMonth();
    const registrationDate = (isEditMode && initialData?.registrationDate) ? initialData.registrationDate : `${regYear}/${regMonth}/${dayPart}`;

    const finalData = {
      ...formData,
      birthDate,
      dispatchDate,
      id: isEditMode && initialData ? initialData.id : Date.now(),
      registrationDate,
      status: (isEditMode && initialData?.status) ? initialData.status : 'ثبت نام نشده',
      examDate: (isEditMode && initialData?.examDate) ? initialData.examDate : '',
      examTime: (isEditMode && initialData?.examTime) ? initialData.examTime : '',
      courseCode: (isEditMode && initialData?.courseCode) ? initialData.courseCode : '',
      skillField: formData.skill1,
    };
    if (formData.isMehtaPlan) {
      finalData.customSkill = formData.skill1;
    }
    delete (finalData as any).birthDay; delete (finalData as any).birthMonth; delete (finalData as any).birthYear;
    delete (finalData as any).dispatchMonth; delete (finalData as any).dispatchYear;

    (async () => {
      try {
        // map to backend schema field names
        const formDataToSend = new FormData();
        formDataToSend.append('firstName', finalData.firstName || '');
        formDataToSend.append('lastName', finalData.lastName || '');
        formDataToSend.append('fatherName', finalData.fatherName || '');
        formDataToSend.append('nationalId', finalData.nationalId || '');
        formDataToSend.append('birthDate', finalData.birthDate);
        formDataToSend.append('phone', finalData.phone || '');
        formDataToSend.append('city', finalData.address || '');
        formDataToSend.append('education', finalData.degree || '');
        formDataToSend.append('maritalStatus', finalData.marital || '');
        formDataToSend.append('skill1', finalData.skill1 || '');
        formDataToSend.append('skill2', finalData.skill2 || '');
        formDataToSend.append('skill3', finalData.skill3 || '');
        formDataToSend.append('skillField', finalData.skillField || '');
        formDataToSend.append('skillHistory', finalData.skillHistory || '');
        formDataToSend.append('requestDormitory', String((finalData as any).requestDormitory || false));
        formDataToSend.append('placeOfService', finalData.placeOfService || '');
        formDataToSend.append('isMehtaPlan', String((finalData as any).isMehtaPlan || false));
        formDataToSend.append('customSkill', (finalData as any).customSkill || '');
        formDataToSend.append('serviceEndMonth', (finalData as any).serviceEndMonth || '');
        formDataToSend.append('serviceEndYear', (finalData as any).serviceEndYear || '');
        formDataToSend.append('hasCertificate', String((finalData as any).hasCertificate || false));
        formDataToSend.append('certificateName', (finalData as any).certificateName || '');
        formDataToSend.append('dispatchDate', finalData.dispatchDate);
        formDataToSend.append('registrationDate', finalData.registrationDate);
        formDataToSend.append('status', finalData.status);
        formDataToSend.append('examDate', finalData.examDate);
        formDataToSend.append('examTime', finalData.examTime);
        formDataToSend.append('courseCode', finalData.courseCode);
        if (formData.photo) {
          formDataToSend.append('photo', formData.photo);
        } else if (deletePhoto) {
          formDataToSend.append('deletePhoto', 'true');
        }

        // if editing and initialData has a DB _id, do PUT to update
        if (isEditMode && (initialData as any)?._id) {
          const adminPass = sessionStorage.getItem('admin_pass') || '';
          const res = await fetch(`/api/persons/${(initialData as any)._id}?pass=${encodeURIComponent(adminPass)}`, {
            method: 'PUT',
            body: formDataToSend,
          });
          const body = await res.json().catch(() => ({}));
          if (res.ok && body.success) {
            setMessage(`${actionText} شما با موفقیت انجام شد.`);
            toast.success(`${actionText} با موفقیت انجام شد!`);
            onSave(finalData as Registration);
            setIsSubmitting(false);
            // after successful DB update, navigate to admin panel
            window.location.href = '/admin';
          } else {
            setMessage(body.message || `خطا در به‌روزرسانی (${res.status})`);
            toast.error(body.message || `خطا در به‌روزرسانی`);
            setIsSubmitting(false);
          }
        } else {
          const res = await fetch('/api/register', {
            method: 'POST',
            body: formDataToSend,
          });
          const body = await res.json().catch(() => ({}));
          if (res.ok && body.success) {
            setMessage(`${actionText} شما با موفقیت انجام شد.`);
            toast.success(`${actionText} با موفقیت انجام شد!`);
            onSave(finalData as Registration);
            setIsSubmitting(false);
            if (!isEditMode) {
              setFormData({
                firstName: '', lastName: '', fatherName: '', nationalId: '',
                birthDay: '', birthMonth: '', birthYear: '', phone: '', address: '',
                degree: 'دیپلم', skill1: '', skill2: '', skill3: '', marital: 'مجرد',
                skillHistory: '',
                dispatchMonth: '', dispatchYear: '', requestDormitory: false, photo: undefined,
                isMehtaPlan: false, customSkill: '', serviceEndMonth: '', serviceEndYear: '',
                hasCertificate: false, certificateName: '',
              });
            }
          } else {
            setMessage(body.message || `خطا در ثبت (${res.status})`);
            toast.error(body.message || `خطا در ثبت`);
            setIsSubmitting(false);
          }
        }
      } catch (err: any) {
        setMessage(err?.message || 'خطا در ارسال اطلاعات');
        toast.error(err?.message || 'خطا در ارسال اطلاعات');
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto bg-white rounded-3xl p-4 md:p-6 shadow-2xl"
      transition={{ duration: 0.5 }}
    >
      {/* tabs for register / exam-intro / tracking */}
      <div className="mb-6 text-center">
        <div className="flex flex-col sm:flex-row rounded-md bg-gray-100 p-1 gap-1 sm:gap-0">
          <motion.button
            className={`px-4 sm:px-6 py-3 rounded-md text-base sm:text-lg font-semibold flex items-center justify-center gap-2 w-full sm:w-auto ${activeFormTab === 'register' ? 'bg-white shadow' : ''}`}
            onClick={() => setActiveFormTab('register')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserPlus className="w-5 h-5 text-blue-400" />
            ثبت نام
          </motion.button>
          <motion.button
            className={`px-4 sm:px-6 py-3 rounded-md text-base sm:text-lg font-semibold flex items-center justify-center gap-2 w-full sm:w-auto ${activeFormTab === 'exam' ? 'bg-white shadow' : ''}`}
            onClick={() => setActiveFormTab('exam')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar className="w-5 h-5 text-green-500" />
            معرفی به آزمون مجدد
          </motion.button>
          <motion.button
            className={`px-4 sm:px-6 py-3 rounded-md text-base sm:text-lg font-semibold flex items-center justify-center gap-2 w-full sm:w-auto ${activeFormTab === 'tracking' ? 'bg-white shadow' : ''}`}
            onClick={() => setActiveFormTab('tracking')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-5 h-5 text-purple-500" />
            پیگیری تاریخ آزمون
          </motion.button>
          <motion.button
            className={`px-4 sm:px-6 py-3 rounded-md text-base sm:text-lg font-semibold flex items-center justify-center gap-2 w-full sm:w-auto ${activeFormTab === 'results' ? 'bg-white shadow' : ''}`}
            onClick={() => setActiveFormTab('results')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="w-5 h-5 text-green-500" />
            مشاهده نتیجه آزمون
          </motion.button>
          <motion.button
            className={`px-4 sm:px-6 py-3 rounded-md text-base sm:text-lg font-semibold flex items-center justify-center gap-2 w-full sm:w-auto ${activeFormTab === 'guidelines' ? 'bg-white shadow' : ''}`}
            onClick={() => setActiveFormTab('guidelines')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5 text-orange-500" />
            اطلاعیه ها
          </motion.button>

        </div>
      </div>
      <div className="flex flex-col lg:grid lg:grid-cols-[0.8fr_1.2fr] gap-x-8 gap-y-6">
        {/* سایدبار */}
        <div className="primary-gradient text-white rounded-2xl p-4 md:p-7 flex flex-col justify-center text-center lg:h-full animate-float">
          <h1 className="text-xl md:text-2xl font-extrabold mb-2.5">{isEditMode ? 'ویرایش اطلاعات' : 'سامانه مهارت آموزی'}</h1>
          <p className="opacity-95 leading-loose mb-4 text-sm md:text-base">{isEditMode ? 'اطلاعات کاربر را ویرایش و ذخیره کنید.' : 'لطفاً فرم ثبت نام را به دقت تکمیل  و ارسال کنید. برای اطلاع از دوره ها و آزمون ها و مشاهده جزوات و نمونه سوالات حتما عضو گروه روبیکا خانه مهارت شوید'}</p>
          <a href="https://rubika.ir/joing/HHGDHBII0YITOVNMCEPDZSYCFQKALVCI" target="_blank" rel="noopener noreferrer" className="cursor-pointer block text-center bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fc/Rubika_Icon.png" alt="Rubika Logo" className="h-20 w-20 mb-2 mx-auto block cursor-pointer hover:scale-110 transition-transform rounded-full shadow-lg hover:shadow-xl" />
            <span className="text-lg font-bold text-white underline block">عضویت در گروه روبیکا خانه مهارت</span>
            <span className="text-xs text-white/80">برای اطلاع از دوره‌ها، آزمون‌ها و جزوات</span>
          </a>
          <button onClick={() => onNavigate(isEditMode ? 'admin' : 'login')} className={secondaryBtnStyle}>
            {isEditMode ? 'بازگشت به پنل' : 'ورود مدیر'}
          </button>
        </div>
        {/* فرم */}
        <div className="lg:col-start-2">
          <AnimatePresence mode="wait">
            {/* show registration or exam intro or tracking form based on activeFormTab */}
            {activeFormTab === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                  <User className="w-6 h-6 text-blue-400" />
                  {isEditMode ? 'فرم ویرایش' : 'فرم ثبت نام'}
                </h2>
                <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-y-2 gap-x-2 md:gap-x-4" autoComplete="off">
                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <label className="label">نام</label>
                    <input className={inputStyle} name="firstName" value={formData.firstName} onChange={handleChange} required />
                  </motion.div>
                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <label className="label">نام خانوادگی</label>
                    <input className={inputStyle} name="lastName" value={formData.lastName} onChange={handleChange} required />
                  </motion.div>
                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <label className="label">نام پدر</label>
                    <input className={inputStyle} name="fatherName" value={formData.fatherName} onChange={handleChange} required />
                  </motion.div>
                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <label className="label">کد ملی</label>
                    <input className={inputStyle} name="nationalId" value={formData.nationalId} onChange={handleChange} pattern="[0-9]{10}" required />
                  </motion.div>
                  <motion.div className="field sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <label className="label">تاریخ تولد</label>
                    <div className="grid grid-cols-3 gap-1 md:gap-2.5">
                      <select className={inputStyle} name="birthDay" value={formData.birthDay} onChange={handleChange} required><option value="" disabled>روز</option>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}</select>
                      <select className={inputStyle} name="birthMonth" value={formData.birthMonth} onChange={handleChange} required><option value="" disabled>ماه</option>{["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}</select>
                      <select className={inputStyle} name="birthYear" value={formData.birthYear} onChange={handleChange} required><option value="" disabled>سال</option>{Array.from({ length: 56 }, (_, i) => 1350 + i).reverse().map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                  </motion.div>
                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <label className="label">شماره تماس</label>
                    <input className={inputStyle} name="phone" value={formData.phone} onChange={handleChange} type="tel" inputMode="numeric" pattern="[0-9]{11}" placeholder="09123456789" required />
                  </motion.div>
                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <label className="label">شهر محل سکونت</label>
                    <input className={inputStyle} name="address" value={formData.address} onChange={handleChange} required />
                  </motion.div>
                  <motion.div className="field sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                    <label className="label">تاریخ اعزام</label>
                    <div className="grid grid-cols-2 gap-1 md:gap-2.5">
                      <select className={inputStyle} name="dispatchMonth" value={formData.dispatchMonth} onChange={handleChange} required><option value="">ماه</option>{["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}</select>
                      <select className={inputStyle} name="dispatchYear" value={formData.dispatchYear} onChange={handleChange} required><option value="">سال</option>{Array.from({ length: 5 }, (_, i) => 1400 + i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                  </motion.div>
                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <label className="label">مدرک تحصیلی</label>
                    <select className={inputStyle} name="degree" value={formData.degree} onChange={handleChange} required>
                      <option value="زیر دیپلم">زیر دیپلم</option><option value="دیپلم">دیپلم</option><option value="فوق دیپلم">فوق دیپلم</option>
                      <option value="لیسانس">لیسانس</option><option value="فوق لیسانس">فوق لیسانس</option><option value="دکتری">دکتری</option>
                    </select>
                  </motion.div>
                  <motion.div className="field sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <label className="label">آیا دارای گواهی فنی حرفه ای یا دیپلم کار و دانش هستید؟</label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" name="hasCertificate" checked={!!formData.hasCertificate} onChange={handleChange} />
                      <span className="text-sm">بله</span>
                    </div>
                  </motion.div>
                  {formData.hasCertificate && (
                    <motion.div className="field sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
                      <label className="label">نام گواهی</label>
                      <input className={inputStyle} name="certificateName" value={formData.certificateName} onChange={handleChange} placeholder="نام گواهی خود را وارد کنید" />
                    </motion.div>
                  )}
                  <motion.div className="field sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                    <label className="label">رشته مهارت آموزی (اولویت بندی کنید)</label>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" name="isMehtaPlan" checked={!!formData.isMehtaPlan} onChange={handleChange} />
                      <span className="text-sm">طرح مهتا (اشتغال پس از آموزش)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select className={inputStyle} name="skill1" value={formData.skill1} onChange={handleChange} required={availableSkills.length > 0}>
                        <option value="">اولویت ۱</option>
                        {availableSkills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                      </select>
                      <select className={inputStyle} name="skill2" value={formData.skill2} onChange={handleChange}>
                        <option value="">اولویت ۲ (اختیاری)</option>
                        {availableSkills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                      </select>
                      <select className={inputStyle} name="skill3" value={formData.skill3} onChange={handleChange}>
                        <option value="">اولویت ۳ (اختیاری)</option>
                        {availableSkills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                      </select>
                    </div>
                    {formData.isMehtaPlan && (
                      <div className="mt-4">
                        <label className="label">تاریخ پایان خدمت </label>
                        <div className="grid grid-cols-2 gap-1 md:gap-2.5">
                          <select className={inputStyle} name="serviceEndMonth" value={formData.serviceEndMonth} onChange={handleChange} required>
                            <option value="">ماه</option>
                            {["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                          </select>
                          <select className={inputStyle} name="serviceEndYear" value={formData.serviceEndYear} onChange={handleChange} required>
                            <option value="">سال</option>
                            {Array.from({ length: 5 }, (_, i) => 1403 + i).map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </motion.div>
                  <motion.div className="field sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
                    <label className="label">سوابق مهارتی</label>
                    <textarea className={`${inputStyle} resize-none`} name="skillHistory" value={formData.skillHistory} onChange={handleChange} rows={3} placeholder="سوابق مهارتی و رشته های مورد علاقه خود را وارد کنید..." />
                  </motion.div>
                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
                    <label className="label">وضعیت تأهل</label>
                    <select className={inputStyle} name="marital" value={formData.marital} onChange={handleChange} required><option value="مجرد">مجرد</option><option value="متاهل">متاهل</option></select>
                  </motion.div>

                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <label className="label"> محل  خدمت (دقت کنید کد محل خدمت با هماهنگی انتخاب شود !!!)</label>
                    <select className={inputStyle} name="placeOfService" value={formData.placeOfService} onChange={handleChange} required>
                      <option value="">انتخاب کنید</option>
                      {serviceLocations.map(location => (
                        <option key={location.value} value={location.value}>{isEditMode ? location.detailed : location.numeric}</option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div className="field" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
                    <label className="label">درخواست خوابگاه</label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" name="requestDormitory" checked={!!formData.requestDormitory} onChange={handleChange} />
                      <span className="text-sm">درخواست خوابگاه دارم</span>
                    </div>
                  </motion.div>
                  <motion.div className="field sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <label className="label">
                      <div className="flex items-center gap-2 mb-1">
                        <Upload className="w-4 h-4 text-orange-500" />
                        <span className="font-bold text-black">عکس پرسنلی(روی گواهی چاپ می‌شود )</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        توجه : در صورت مشاهده خطای 400 حجم  عکس خود را کاهش دهید (زیر300 کیلوبایت). اندازه عکس باید 4*3 باشد.
                      </div>
                    </label>
                    {isEditMode && (initialData as any)?.hasPhoto && !deletePhoto && !formData.photo && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">عکس فعلی:</p>
                        <motion.img
                          src={`/api/persons/${(initialData as any)._id}?photo=true&pass=${encodeURIComponent(sessionStorage.getItem('admin_pass') || '')}&t=${Date.now()}`}
                          alt="عکس فعلی"
                          className="w-20 h-20 object-cover border rounded animate-zoom"
                          whileHover={{ scale: 1.1 }}
                        />
                        <button type="button" onClick={() => setDeletePhoto(true)} className="mt-1 text-red-500 text-sm underline">حذف عکس</button>
                      </div>
                    )}
                    {deletePhoto && <p className="text-sm text-red-600 mb-2">عکس حذف خواهد شد.</p>}
                    {formData.photo && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">پیش نمایش عکس جدید:</p>
                        <motion.img
                          src={URL.createObjectURL(formData.photo)}
                          alt="پیش نمایش"
                          className="w-20 h-20 object-cover border rounded animate-zoom"
                          whileHover={{ scale: 1.1 }}
                        />
                      </div>
                    )}
                    <input type="file" name="photo" accept="image/*" onChange={handleChange} className={inputStyle} />
                  </motion.div>
                  <motion.div className="actions sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
                    <motion.button
                      className={primaryBtnStyle}
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      {isEditMode ? 'ذخیره تغییرات' : 'ارسال اطلاعات'}
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>
            )}
            {activeFormTab === 'exam' && (
              <motion.div
                key="exam"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <ExamIntroForm onNavigate={onNavigate} />
              </motion.div>
            )}
            {activeFormTab === 'tracking' && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleTrackingSubmit} className="grid sm:grid-cols-2 gap-2 md:gap-3">
                  <motion.div className="field sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <label className="label flex items-center gap-2">
                      <Search className="w-4 h-4 text-purple-500" />
                      کد ملی
                    </label>
                    <input className={inputStyle} value={trackingNationalId} onChange={(e) => setTrackingNationalId(e.target.value)} pattern="[0-9]{10}" required />
                  </motion.div>
                  <motion.div className="sm:col-span-2 text-center mt-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <motion.button className="w-full bg-purple-600 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-purple-700 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 animate-lift" type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Search className="w-5 h-5 text-white" />
                      بررسی وضعیت
                    </motion.button>
                  </motion.div>
                  {trackingMessage && <div className="sm:col-span-2 text-center mt-2 text-sm font-medium">{trackingMessage}</div>}
                  {trackingResult && (
                    <motion.div
                      className="sm:col-span-2 text-center mt-2 p-4 bg-green-50 border border-green-200 rounded-lg"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold">تاریخ آزمون: {trackingResult.examDate}</p>
                      <a href="https://azmoon.portaltvto.com/card/card/index/1/80" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-purple-700 transition-colors">مشاهده کارت آزمون</a>
                      <p className="text-sm text-gray-600 mt-1">دریافت کارت ورود به جلسه 2 روز قبل از روز آزمون امکان پذیر است</p>
                    </motion.div>
                  )}

                </form>

              </motion.div>

            )}

            {activeFormTab === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                  <Eye className="w-6 h-6 text-green-500" />
                  مشاهده نتیجه آزمون
                </h2>
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-300 text-green-800 p-4 md:p-6 rounded-lg">
                    <h3 className="font-bold text-lg mb-4">راهنمایی مشاهده نتیجه آزمون</h3>
                    <p className="mb-4">برای مشاهده نتیجه آزمون خود به لینک زیر مراجعه کنید:</p>
                    <a href="https://azmoon.portaltvto.com/result/result/index/1/80" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-purple-700 transition-colors font-semibold">مشاهده نتیجه آزمون</a>
                    <div className="mt-4 space-y-2">
                      <p>توضیحات:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>بعد از ۲ الی ۳ روز کاری از زمان آزمون آنلاین نمره داخل سایت گذاشته می‌شود.</li>
                        <li>نمره قبولی تئوری ۵۰ به بالا می‌باشد.</li>
                        <li>زمان ثبت نمره عملی حدوداً یک الی دو ماه بعد از نمره تئوری است.</li>
                        <li>در صورت درج نمره عملی و نتیجه نهایی قبولی برای دریافت مدرک خود به سایت <a href="https://pay.portaltvto.com/pay/licence2" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-purple-700">https://pay.portaltvto.com/pay/licence2</a> رفته و هزینه صدور گواهی خود به مبلغ ۱۰۰ هزار تومان را پرداخت کنید تا مدرک شما صادر گردد.</li>
                        <li>سپس به سایت <a href="https://azmoon.portaltvto.com/estelam/estelam" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-purple-700">https://azmoon.portaltvto.com/estelam/estelam</a> رفته و مدرک خود را دریافت کنید.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeFormTab === 'guidelines' && (

              <motion.div

                key="guidelines"

                initial={{ opacity: 0, x: -20 }}

                animate={{ opacity: 1, x: 0 }}

                exit={{ opacity: 0, x: 20 }}

                transition={{ duration: 0.3 }}

              >

                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">

                  <Bell className="w-6 h-6 text-orange-500" />

                  اطلاعیه ها

                </h2>

                <div className="space-y-6">

                  <div>

                    <h3 className="font-bold text-lg mb-4">اطلاعیه ها</h3>

                    {announcements.length === 0 ? (

                      <p className="text-gray-500">هیچ اطلاعیه ای وجود ندارد.</p>

                    ) : (

                      <div className="space-y-4">

                        {announcements.map((ann: any) => (
                          <div key={ann._id} className="bg-white border rounded-lg p-4 shadow">
                            <h4 className="font-semibold">{ann.title}</h4>
                            <p className="mt-2" dangerouslySetInnerHTML={{ __html: convertUrlsToLinks(ann.content) }}></p>
                            {ann.imageUrl && <img src={ann.imageUrl} alt="تصویر اطلاعیه" className="mt-2 max-w-full h-auto" />}
                          </div>
                        ))}

                      </div>

                    )}

                  </div>

                </div>

              </motion.div>

            )}



          </AnimatePresence>

          {message && (
            <motion.p
              className={`text-center mt-4 font-bold p-2.5 rounded-md ${message.includes('موفقیت') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message}
            </motion.p>
          )}
        </div>
      </div>
      <div className="md:hidden text-center mt-4">
        <button onClick={() => onNavigate(isEditMode ? 'admin' : 'login')} className={secondaryBtnStyle}>
          {isEditMode ? 'بازگشت به پنل' : 'ورود مدیر'}
        </button>
      </div>
    </motion.div>
  );
};



// === فرم معرفی به آزمون (مستقل از فرم ثبت نام) ===
const ExamIntroForm = ({ onNavigate }: { onNavigate: (page: 'register' | 'admin' | 'login') => void }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [skillField, setSkillField] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('در حال ارسال...');
    try {
      const res = await fetch('/api/examintro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, nationalId, phone, skillField, courseMonth: month, courseYear: year })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setMessage('معرفی به آزمون با موفقیت ثبت شد.');
        setFirstName(''); setLastName(''); setNationalId(''); setPhone(''); setSkillField(''); setMonth(''); setYear('');
      } else {
        setMessage(body.message || `خطا (${res.status})`);
      }
    } catch (err: any) { setMessage(err?.message || 'خطا در ارسال'); }
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-300 text-blue-800 p-4 md:p-6 rounded-lg mb-6 text-right leading-relaxed">
        <h3 className="font-bold text-lg mb-4 text-center">دستورالعمل معرفی به آزمون مجدد</h3>
        <ol className="list-decimal list-inside space-y-3">
          <li>ابتدا وارد لینک زیر شوید و اطلاعات خواسته شده را به دقت پر کنید. سپس قسمت اعتبار بار دوم معرفی به آزمون کتبی که به مبلغ ۲۰۰ هزار تومان است را به اندازه یک تعداد انتخاب کنید و گزینه ذخیره را بزنید.<br />
            <a href="https://pay.portaltvto.com/payment/shop/prepay" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800 font-semibold">https://pay.portaltvto.com/payment/shop/prepay</a>
          </li>
          <li>در صفحه بعد مشخصات خود را تایید کنید. سپس وارد صفحه پرداخت می‌شوید. پرداخت خود را انجام دهید.</li>
          <li>بعد از پرداخت و ثبت اطلاعات خود در این صفحه ، رسید پرداختی خود را به مدیر گروه روبیکا ارسال کنید تا معرفی به آزمون شوید.</li>
        </ol>
      </div>
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
        <div className="field"><label className="label">نام</label><input className={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
        <div className="field"><label className="label">نام خانوادگی</label><input className={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
        <div className="field"><label className="label">کد ملی</label><input className={inputStyle} value={nationalId} onChange={(e) => setNationalId(e.target.value)} pattern="[0-9]{10}" required /></div>
        <div className="field"><label className="label">شماره تماس</label><input className={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
        <div className="field"><label className="label">رشته مهارت آموزی</label><input className={inputStyle} value={skillField} onChange={(e) => setSkillField(e.target.value)} required /></div>
        <div className="field">
          <label className="label">ماه/سال دوره</label>
          <div className="grid grid-cols-2 gap-1 md:gap-2">
            <select className={inputStyle} value={month} onChange={(e) => setMonth(e.target.value)} required>
              <option value="">ماه</option>{["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className={inputStyle} value={year} onChange={(e) => setYear(e.target.value)} required>
              <option value="">سال</option>{[1400, 1401, 1402, 1403, 1404].map(y => <option key={y} value={String(y)}>{String(y)}</option>)}
            </select>
          </div>
        </div>
        <div className="sm:col-span-2 text-center mt-2"><button className={primaryBtnStyle} type="submit">ثبت معرفی به آزمون</button></div>
        {message && <div className="sm:col-span-2 text-center mt-2 text-sm font-medium">{message}</div>}
      </form>
    </div>
  );
};

// small helper to redirect to dedicated admin route
const AdminRedirect = () => {
  useEffect(() => {
    window.location.href = '/admin';
  }, []);
  return null;
};

// Note: Admin UI moved to dedicated route at /admin (app/admin/page.tsx). This file only contains registration and exam intro forms.

// === کامپوننت اصلی برای مدیریت صفحات ===
export default function Page() {
  const [page, setPage] = useState<'register' | 'admin' | 'login' | 'edit'>('register');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [editingUser, setEditingUser] = useState<Registration | null>(null);

  useEffect(() => {
    try {
      const savedRegistrations = localStorage.getItem('registrations');
      if (savedRegistrations) { setRegistrations(JSON.parse(savedRegistrations)); }
    } catch (error) { console.error("Failed to parse registrations from localStorage", error); }
  }, []);

  // check for editId query param (admin -> edit via main form)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('editId');
      if (editId) {
        // fetch person from backend
        (async () => {
          try {
            const res = await fetch(`/api/persons/${editId}?pass=${encodeURIComponent(sessionStorage.getItem('admin_pass') || '')}`);
            const body = await res.json().catch(() => ({}));
            if (res.ok && body.success) {
              const p = body.data;
              // map backend fields to Registration shape
              const registration: any = {
                id: Date.now(),
                birthDate: p.birthDate,
                dispatchDate: p.dispatchDate || '',
                registrationDate: new Date(p.createdAt).toLocaleDateString('fa-IR'),
                status: p.status || 'ثبت نام نشده',
                examDate: p.examDate || '',
                examTime: p.examTime || '',
                courseCode: p.courseCode || '',
                firstName: p.firstName,
                lastName: p.lastName,
                fatherName: p.fatherName,
                nationalId: p.nationalId,
                phone: p.phone,
                address: p.city,
                degree: p.education,
                skill1: p.skill1 || p.skillField || '',
                skill2: p.skill2 || '',
                skill3: p.skill3 || '',
                skillHistory: p.skillHistory || '',
                marital: p.maritalStatus,
                requestDormitory: p.requestDormitory || false,
                isMehtaPlan: p.isMehtaPlan || false,
                customSkill: p.customSkill || '',
                serviceEndMonth: p.serviceEndMonth || '',
                serviceEndYear: p.serviceEndYear || '',
                placeOfService: p.placeOfService || '',
                hasPhoto: p.hasPhoto,
                _id: p._id,
              };
              setEditingUser(registration);
              setPage('edit');
            }
          } catch (err) { console.error('fetch person for edit failed', err); }
        })();
      }
    } catch (err) { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem('registrations', JSON.stringify(registrations));
  }, [registrations]);

  const handleSaveUser = (userToSave: Registration) => {
    const userExists = registrations.find(r => r.id === userToSave.id);
    if (userExists) {
      setRegistrations(registrations.map(r => r.id === userToSave.id ? userToSave : r));
      setPage('admin');
    } else {
      setRegistrations(prev => [...prev, userToSave]);
    }
    setEditingUser(null);
  };

  const handleEditClick = (userToEdit: Registration) => {
    setEditingUser(userToEdit);
    setPage('edit');
  };

  const handleDeleteClick = (userIdToDelete: number) => {
    if (window.confirm('آیا از حذف این کاربر مطمئن هستید؟')) {
      setRegistrations(registrations.filter(r => r.id !== userIdToDelete));
    }
  };

  const handleLoginSuccess = () => { setPage('admin'); };

  const handleUpdateRegistration = (userId: number, field: keyof Registration, value: string) => {
    setRegistrations(prev =>
      prev.map(user => {
        if (user.id === userId) {
          const updatedUser = { ...user, [field]: value };
          if (field === 'status' && (value === 'ثبت نام شده' || value === 'ثبت نام نشده')) {
            updatedUser.examDate = '';
            updatedUser.examTime = '';
          }
          return updatedUser;
        }
        return user;
      })
    );
  };

  const navigateTo = (targetPage: 'register' | 'admin' | 'login') => {
    setEditingUser(null);
    if (targetPage === 'admin') {
      // navigate to dedicated admin route
      window.location.href = '/admin';
      return;
    }
    if (targetPage === 'login') {
      // navigate to dedicated login route
      window.location.href = '/login';
      return;
    }
    setPage(targetPage);
  };

  return (
    <main>
      {(page === 'register' || page === 'edit') &&
        <RegisterForm
          onNavigate={navigateTo}
          onSave={handleSaveUser}
          initialData={editingUser}
          isEditMode={page === 'edit'}
        />
      }
      {page === 'admin' && <AdminRedirect />}
    </main>
  );
}
