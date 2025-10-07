// utils/sendPaymentEmail.ts
import nodemailer from 'nodemailer';
import { paymentFailedTemplate, paymentSuccessTemplate } from './emailTemplates';

// 1. Transporter তৈরি
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // => Gmail App Password
  },
});

// 2. SMTP Verify — রানটাইমে একবার
transporter.verify((err, success) => {
  if (err) {
    console.error('SMTP verification failed:', err);
  } else {
    console.log('✅ SMTP ready:', success);
  }
});

export const sendPaymentSuccessEmail = async (
  email: string,
  userName: string,
  courseTitle: string,
  amount: number,
  transactionId: string
) => {
  const html = paymentSuccessTemplate(userName, courseTitle, amount, transactionId);

  console.log('Sending success email to', email);
  try {
    const info = await transporter.sendMail({
      from: `"CADD CORE" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '✅ Payment Successful - CADD CORE',
      html,
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending success email:', error);
    throw error;
  }
};

export const sendPaymentFailedEmail = async (
  email: string,
  userName: string,
  amount: number,
  transactionId: string
) => {
  const html = paymentFailedTemplate(userName, amount, transactionId);

  console.log('Sending failure email to', email);
  try {
    const info = await transporter.sendMail({
      from: `"CADD CORE" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '❌ Payment Failed - CADD CORE',
      html,
    });
    console.log('Failure email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending failure email:', error);
    throw error;
  }
};
