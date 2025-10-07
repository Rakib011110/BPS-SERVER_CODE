// import nodemailer from 'nodemailer';
// import config from '../../config';

// /**
//  * Test Email Configuration and Send Test Reference Email
//  * This utility helps debug email sending issues
//  */

// export const testEmailConfiguration = async () => {
//   console.log('🔧 Testing Email Configuration...');
  
//   // Display current configuration (without exposing sensitive data)
//   console.log('📧 Email Configuration:');
//   console.log('Host:', config.email_host);
//   console.log('Port:', config.email_port);
//   console.log('User:', config.email_user ? `${config.email_user.substring(0, 3)}***` : 'NOT SET');
//   console.log('From:', config.email_from);
  
//   // Create transporter with current config
//   const transporter = nodemailer.createTransport({
//     host: config.email_host,
//     port: Number(config.email_port),
//     secure: false, // TLS
//     auth: {
//       user: config.email_user,
//       pass: config.email_pass,
//     },
//   });

//   try {
//     // Test SMTP connection
//     console.log('🔌 Testing SMTP connection...');
//     const isConnected = await transporter.verify();
//     console.log('✅ SMTP Connection:', isConnected ? 'SUCCESS' : 'FAILED');
    
//     return {
//       success: true,
//       connection: isConnected,
//       config: {
//         host: config.email_host,
//         port: config.email_port,
//         user: config.email_user ? `${config.email_user.substring(0, 3)}***` : 'NOT SET',
//         from: config.email_from
//       }
//     };
    
//   } catch (error: any) {
//     console.error('❌ SMTP Connection Error:', error.message);
    
//     return {
//       success: false,
//       error: error.message,
//       config: {
//         host: config.email_host,
//         port: config.email_port,
//         user: config.email_user ? 'SET' : 'NOT SET',
//         from: config.email_from
//       }
//     };
//   }
// };

// export const sendTestReferenceEmail = async (testEmail: string = 'test@example.com') => {
//   const { sendReferenceRequestEmail } = await import('./sendMembershipEmail');
  
//   console.log('📧 Sending test reference email to:', testEmail);
  
//   try {
//     const result = await sendReferenceRequestEmail(
//       testEmail,
//       'Test Reference Member',
//       'Test Applicant Name', 
//       'testapplicant@example.com',
//       'MEMBER',
//       'https://yourdomain.com/login'
//     );
    
//     console.log('✅ Test email sent successfully:', result);
//     return { success: true, result };
    
//   } catch (error: any) {
//     console.error('❌ Test email failed:', error);
//     return { success: false, error: error.message };
//   }
// };

// export default {
//   testEmailConfiguration,
//   sendTestReferenceEmail
// };
