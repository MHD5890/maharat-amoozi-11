import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { password } = await request.json();
        // رمز عبور را از متغیرهای محیطی بخوانید تا امنیت بیشتر شود
        // default admin password for local/dev when ADMIN_PASS not set
        const adminPassword = process.env.ADMIN_PASS || 'maharat123';

        if (password === adminPassword) {
            // در یک اپلیکیشن واقعی، اینجا باید یک توکن JWT یا سشن ایجاد کنید
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'رمز عبور اشتباه است.' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}