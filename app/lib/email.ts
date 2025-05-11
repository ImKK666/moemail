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
    // 当提供HTML内容时
    if (html) {
      const { data, error } = await resend.emails.send({
        from: from || DEFAULT_FROM,
        to,
        subject,
        react: React.createElement('div', { dangerouslySetInnerHTML: { __html: html } }),
      });

      if (error) {
        console.error('Failed to send email:', error);
        throw new Error(error.message);
      }

      return { id: data?.id, success: true };
    } 
    // 当只有纯文本内容时
    else if (text) {
      const { data, error } = await resend.emails.send({
        from: from || DEFAULT_FROM,
        to,
        subject,
        react: React.createElement('pre', null, text),
      });

      if (error) {
        console.error('Failed to send email:', error);
        throw new Error(error.message);
      }
      
      return { id: data?.id, success: true };
    }
    
    throw new Error("邮件内容不能为空");
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}