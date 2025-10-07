import nodemailer from 'nodemailer';

// Email configuration using your existing SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'ariyanrakib980@gmail.com',
    pass: process.env.EMAIL_PASS || 'kuskqqmiurneiumk'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Enhanced email sending function with better error handling
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    // Verify transporter configuration
    await transporter.verify();
    
    const mailOptions = {
      from: `"E-Commerce Store" <${process.env.EMAIL_FROM || 'ariyanrakib980@gmail.com'}>`,
      to,
      subject,
      html,
      // Also send plain text version
      text: html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });
    
    return true;
  } catch (error: any) {
    console.error('Email sending error:', {
      error: error.message,
      to: to,
      subject: subject,
      code: error.code,
      command: error.command
    });
    return false;
  }
};

export default sendEmail;