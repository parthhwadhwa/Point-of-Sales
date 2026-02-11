import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, getTokenName } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        const response = NextResponse.json({
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });

        response.cookies.set(getTokenName(), token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 8, // 8 hours
            path: "/",
        });

        return response;
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
