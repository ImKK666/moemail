"use client"

import { useState, useEffect } from "react"
import { Calendar, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useThrottle } from "@/hooks/use-throttle"

interface SentMessage {
  id: string
  toAddress: string
  subject: string
  sentAt: number
  status: string
}

interface SentMessageListProps {
  email: {
    id: string
    address: string
  }
  onMessageSelect: (messageId: string | null) => void
  selectedMessageId?: string | null
}

interface SentMessagesResponse {
  messages: SentMessage[]
  nextCursor: string | null
  total: number
}

export function SentMessageList({ email, onMessageSelect, selectedMessageId }: SentMessageListProps) {
  const [messages, setMessages] = useState<SentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchMessages = async (cursor?: string) => {
    try {
      const url = new URL(`/api/emails/${email.id}/sent`, window.location.origin)
      if (cursor) {
        url.searchParams.set('cursor', cursor)
      }
      const response = await fetch(url)
      const data = await response.json() as SentMessagesResponse
      
      if (!cursor) {
        const newMessages = data.messages
        const oldMessages = messages

        const lastDuplicateIndex = newMessages.findIndex(
          newMsg => oldMessages.some(oldMsg => oldMsg.id === newMsg.id)
        )

        if (lastDuplicateIndex === -1) {
          setMessages(newMessages)
          setNextCursor(data.nextCursor)
          setTotal(data.total)
          return
        }
        const uniqueNewMessages = newMessages.slice(0, lastDuplicateIndex)
        setMessages([...uniqueNewMessages, ...oldMessages])
        setTotal(data.total)
        return
      }
      setMessages(prev => [...prev, ...data.messages])
      setNextCursor(data.nextCursor)
      setTotal(data.total)
    } catch (error) {
      console.error("Failed to fetch sent messages:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMessages()
  }

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    if (loadingMore) return

    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget
    const threshold = clientHeight * 1.5
    const remainingScroll = scrollHeight - scrollTop

    if (remainingScroll <= threshold && nextCursor) {
      setLoadingMore(true)
      fetchMessages(nextCursor)
    }
  }, 200)

  useEffect(() => {
    if (email?.id) {
      setLoading(true)
      fetchMessages()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email.id])

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 flex justify-between items-center border-b border-primary/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className={cn("h-8 w-8", refreshing && "animate-spin")}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <span className="text-xs text-gray-500">
          {total > 0 ? `${total} 封已发送邮件` : "暂无已发送邮件"}
        </span>
      </div>

      <div className="flex-1 overflow-auto" onScroll={handleScroll}>
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">加载中...</div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-primary/10">
            {messages.map(message => (
              <div
                key={message.id}
                onClick={() => onMessageSelect(message.id)}
                className={cn(
                  "p-3 hover:bg-primary/5 cursor-pointer group",
                  selectedMessageId === message.id && "bg-primary/10"
                )}
              >
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-sm truncate">{message.subject}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate">发送至: {message.toAddress}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(message.sentAt).toLocaleString()}
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-xs",
                      message.status === "sent" ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" : 
                      message.status === "failed" ? "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400" :
                      "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                    )}>
                      {message.status === "sent" ? "已发送" : 
                      message.status === "failed" ? "失败" : "处理中"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {loadingMore && (
              <div className="text-center text-sm text-gray-500 py-2">
                加载更多...
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            暂无发送邮件记录
          </div>
        )}
      </div>
    </div>
  )
}