import React from 'react';
import { Resend } from 'resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export async function sendEmail({ to, subject, text, html, from }: SendEmailOptions) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const DEFAULT_FROM = process.env.EMAIL_SENDER_NAME 
    ? `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS || 'noreply@92.run'}>`
    : (process.env.EMAIL_SENDER_ADDRESS || 'noreply@92.run');
  
  try {
    // 检测环境是否支持MessageChannel
    const isMessageChannelSupported = typeof MessageChannel !== 'undefined';
    
    // 在支持MessageChannel的环境中使用React
    if (isMessageChannelSupported) {
      if (html) {
        const { data, error } = await resend.emails.send({
          from: from || DEFAULT_FROM,
          to,
          subject,
          react: React.createElement('div', { dangerouslySetInnerHTML: { __html: html } }),
        });

        if (error) {
          console.error('Failed to send email with React HTML:', error);
          throw new Error(error.message);
        }

        return { id: data?.id, success: true };
      } 
      else if (text) {
        const { data, error } = await resend.emails.send({
          from: from || DEFAULT_FROM,
          to,
          subject,
          react: React.createElement('pre', null, text),
        });

        if (error) {
          console.error('Failed to send email with React text:', error);
          throw new Error(error.message);
        }
        
        return { id: data?.id, success: true };
      }
    } 
    // 在不支持MessageChannel的环境中使用直接API
    else {
      // 使用类型断言绕过类型检查
      const payload: any = {
        from: from || DEFAULT_FROM,
        to,
        subject,
      };
      
      // 优先使用HTML内容
      if (html) {
        payload.html = html;
      } else if (text) {
        payload.text = text;
      }
      
      const { data, error } = await resend.emails.send(payload);

      if (error) {
        console.error('Failed to send email with direct API:', error);
        throw new Error(error.message);
      }
      
      return { id: data?.id, success: true };
    }
    
    throw new Error("邮件内容不能为空");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error(`Error sending email: ${errorMessage}`);
    throw new Error(`发送邮件失败: ${errorMessage}`);
  }
}