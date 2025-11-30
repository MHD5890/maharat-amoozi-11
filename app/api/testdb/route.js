import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();
        return NextResponse.json({ success: true, message: "✅ اتصال به دیتابیس برقرار است" });
    } catch (err) {
        return NextResponse.json({ success: false, message: "❌ اتصال به دیتابیس شکست خورد", error: err.message });
    }
}
