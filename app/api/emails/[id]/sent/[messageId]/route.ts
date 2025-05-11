import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { sentMessages, emails } from "@/lib/schema"
import { and, eq } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

export async function GET(
  _request: Request, 
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id, messageId } = await params
    const db = createDb()
    const userId = await getUserId()

    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, id),
        eq(emails.userId, userId!)
      )
    })

    if (!email) {
      return NextResponse.json(
        { error: "无权限查看" },
        { status: 403 }
      )
    }

    const message = await db.query.sentMessages.findFirst({
      where: and(
        eq(sentMessages.id, messageId),
        eq(sentMessages.emailId, id)
      )
    })
    
    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: {
        id: message.id,
        to_address: message.toAddress,
        subject: message.subject,
        content: message.content,
        html: message.html,
        sent_at: message.sentAt.getTime(),
        status: message.status,
        error: message.error
      }
    })
  } catch (error) {
    console.error('Failed to fetch sent message:', error)
    return NextResponse.json(
      { error: "Failed to fetch sent message" },
      { status: 500 }
    )
  }
}