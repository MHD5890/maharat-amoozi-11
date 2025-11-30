// lib/checkAdmin.js
import { NextResponse } from "next/server";

export function checkAdmin(request) {
    const url = new URL(request.url);
    const pass = url.searchParams.get("pass");

    // allow a fallback admin password when ADMIN_PASS is not set (dev/local)
    const adminPassword = process.env.ADMIN_PASS || 'maharat123';

    if (pass !== adminPassword) {
        return NextResponse.json(
            { success: false, message: "دسترسی غیرمجاز" },
            { status: 401 }
        );
    }

    return null;
}
