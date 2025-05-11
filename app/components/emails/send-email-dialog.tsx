"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SendEmailDialogProps {
  emailAddress: string;
  emailId: string;
}

interface EmailApiResponse {
  error?: string;
  success?: boolean;
  messageId?: string;
}

export function SendEmailDialog({ emailAddress, emailId }: SendEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!to || !subject || !content) {
      toast({
        title: "错误",
        description: "请填写所有必填字段",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId,
          to,
          subject,
          content
        })
      })

      if (!response.ok) {
        const data = await response.json() as EmailApiResponse;
        if ('error' in data) {
          throw new Error(data.error as string || "发送失败");
        }
      }

      toast({
        title: "成功",
        description: "邮件已发送"
      })
      setOpen(false)
      setTo("")
      setSubject("")
      setContent("")
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "发送邮件失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          发送邮件
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>发送新邮件</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">发件人</label>
            <Input value={emailAddress} disabled />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">收件人</label>
            <Input 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              placeholder="recipient@example.com" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">主题</label>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="邮件主题" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">内容</label>
            <Textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="邮件内容" 
              rows={8}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            发送
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}