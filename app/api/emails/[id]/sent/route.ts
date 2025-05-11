import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { emails, sentMessages } from "@/lib/schema"
import { eq, and, lt, or, sql } from "drizzle-orm"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

const PAGE_SIZE = 20

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url)
  const cursorStr = searchParams.get('cursor')

  try {
    const db = createDb()
    const { id } = await params

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

    const baseConditions = eq(sentMessages.emailId, id)

    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(sentMessages)
      .where(baseConditions)
    const totalCount = Number(totalResult[0].count)

    const conditions = [baseConditions]

    if (cursorStr) {
      const { timestamp, id: messageId } = decodeCursor(cursorStr)
      conditions.push(
        // @ts-expect-error "ignore the error"
        or(
          lt(sentMessages.sentAt, new Date(timestamp)),
          and(
            eq(sentMessages.sentAt, new Date(timestamp)),
            lt(sentMessages.id, messageId)
          )
        )
      )
    }

    const results = await db.query.sentMessages.findMany({
      where: and(...conditions),
      orderBy: (table, { desc }) => [
        desc(table.sentAt),
        desc(table.id)
      ],
      limit: PAGE_SIZE + 1
    })
    
    const hasMore = results.length > PAGE_SIZE
    const nextCursor = hasMore 
      ? encodeCursor(
          results[PAGE_SIZE - 1].sentAt.getTime(),
          results[PAGE_SIZE - 1].id
        )
      : null
    const messageList = hasMore ? results.slice(0, PAGE_SIZE) : results

    return NextResponse.json({ 
      messages: messageList.map(msg => ({
        id: msg.id,
        toAddress: msg.toAddress,
        subject: msg.subject,
        sentAt: msg.sentAt.getTime(),
        status: msg.status
      })),
      nextCursor,
      total: totalCount
    })
  } catch (error) {
    console.error('Failed to fetch sent messages:', error)
    return NextResponse.json(
      { error: "Failed to fetch sent messages" },
      { status: 500 }
    )
  }
}