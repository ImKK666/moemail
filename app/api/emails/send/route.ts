import { NextResponse } from "next/server";
import { createDb } from "@/lib/db";
import { emails, sentMessages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { getUserId } from "@/lib/apiKey";
import { z } from "zod";

export const runtime = "edge";

// 验证发送邮件请求的模式
const sendEmailSchema = z.object({
  emailId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1),
  content: z.string().min(1),
  html: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const json = await request.json();
    
    // 验证请求数据
    const result = sendEmailSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "请求数据无效", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { emailId, to, subject, content, html } = result.data;
    
    // 验证用户拥有这个邮箱
    const db = createDb();
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });
    
    if (!email || email.userId !== userId) {
      return NextResponse.json(
        { error: "无权限使用此邮箱发送邮件" },
        { status: 403 }
      );
    }
    
    // 发送邮件
    const { id: messageId } = await sendEmail({
      from: email.address,
      to,
      subject,
      text: content,
      html,
    });
    
    // 记录发送的邮件
    const [sentMessage] = await db.insert(sentMessages)
      .values({
        emailId,
        toAddress: to,
        subject,
        content,
        html: html || null,
        status: "sent",
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      messageId,
      sentMessageId: sentMessage.id
    });
    
  } catch (error) {
    console.error("发送邮件失败:", error);
    return NextResponse.json(
      { error: "发送邮件失败", message: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}