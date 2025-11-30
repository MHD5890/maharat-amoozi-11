"use client";
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Shield } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [existingAuth, setExistingAuth] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setExistingAuth(sessionStorage.getItem('admin_auth') === 'true');
        }
    }, []);

    // Do NOT auto-redirect even if sessionStorage contains admin flags.
    // We still show a small hint if an admin session exists, but require password entry.
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        const ADMIN_PASSWORD = 'maharat123';
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_auth', 'true');
            sessionStorage.setItem('admin_pass', password);
            router.push('/admin');
        } else {
            setError('رمز عبور اشتباه است.');
        }
    };

    if (!mounted) {
        return <div className="min-h-screen primary-gradient p-6" style={{ direction: 'rtl' }} />;
    }

    return (
        <div className="min-h-screen primary-gradient p-6 animate-fade-in" style={{ direction: 'rtl' }}>
            <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl glass animate-zoom">
                <h1 className="text-2xl font-bold text-center mb-6 text-white flex items-center justify-center gap-2"><Shield className="w-6 h-6 text-purple-400" />ورود به پنل مدیریت</h1>
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
                    <div>
                        <label className="block mb-2 text-sm text-white flex items-center gap-2"><Lock className="w-4 h-4 text-blue-400" />رمز عبور</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 border-white/20 rounded-xl py-2.5 px-3.5 outline-none bg-white/20 text-white placeholder-white/70 transition-all duration-200 focus:border-white focus:ring-4 focus:ring-white/20" autoComplete="current-password" required />
                    </div>
                    {error && <div className="text-center text-red-500 font-bold animate-shake">{error}</div>}
                    {existingAuth && <div className="text-center text-sm text-white/80"> برای ورود  لطفاً رمز را وارد و تأیید کنید.</div>}
                    <div>
                        <button type="submit" className="w-full bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-teal-500 transition-all duration-300 cursor-pointer btn-lively">ورود</button>
                    </div>
                    <div className="text-center mt-3"><Link href="/" className="text-sm text-white/80 hover:text-white transition">بازگشت به فرم ثبت نام</Link></div>
                </form>
            </div>
        </div>
    );
}
