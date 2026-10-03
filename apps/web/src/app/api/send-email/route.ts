import { NextResponse } from "next/server";
import { createTransport } from "nodemailer";

export async function POST(request: Request) {
  try {
    const { to, code, userName, secret, subject, html } = await request.json();

    // Verify secret to prevent abuse
    const expectedSecret = process.env.EMAIL_API_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!to) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) {
      console.error("SMTP credentials are not configured.");
      return NextResponse.json({ message: "Email service not configured" }, { status: 500 });
    }

    const transporter = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Generic mode: caller supplies the subject + HTML (order emails, alerts…).
    if (typeof html === "string" && html.trim()) {
      await transporter.sendMail({
        from: `"Shohoz Skill" <${smtpUser}>`,
        to,
        subject: typeof subject === "string" && subject ? subject : "Shohoz Skill",
        html,
      });
      return NextResponse.json({ success: true });
    }

    if (!code) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1e293b;">
    <div style="padding:32px 28px 20px;text-align:center;background:linear-gradient(135deg,#f59e0b,#d97706);">
      <h1 style="margin:0;color:#0a0e1a;font-size:22px;font-weight:800;">Shohoz Skill</h1>
      <p style="margin:6px 0 0;color:#1a1a2e;font-size:13px;">Learn to Earn</p>
    </div>
    <div style="padding:32px 28px;">
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 8px;">
        ${userName ? `প্রিয় <strong>${userName}</strong>,` : 'হ্যালো,'}
      </p>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">
        আপনার Shohoz Skill একাউন্ট ভেরিফাই করতে নিচের কোডটি ব্যবহার করুন:
      </p>
      <div style="text-align:center;margin:20px 0;">
        <div style="display:inline-block;background:#1e293b;border:2px solid #f59e0b;border-radius:12px;padding:16px 40px;">
          <span style="font-size:32px;font-weight:900;letter-spacing:12px;color:#f59e0b;">${code}</span>
        </div>
      </div>
      <p style="color:#64748b;font-size:12px;text-align:center;margin:20px 0 0;">
        এই কোডটি ৫ মিনিটের মধ্যে মেয়াদ শেষ হবে।<br/>
        আপনি এই রিকোয়েস্ট না করলে এই ইমেইল উপেক্ষা করুন।
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1e293b;text-align:center;">
      <p style="margin:0;color:#475569;font-size:11px;">
        © ${new Date().getFullYear()} Shohoz Skill — shohozskill.com.bd
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await transporter.sendMail({
      from: `"Shohoz Skill" <${smtpUser}>`,
      to,
      subject: `আপনার ভেরিফিকেশন কোড: ${code}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
