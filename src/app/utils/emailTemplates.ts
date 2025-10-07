export const paymentSuccessTemplate = (
  userName: string,
  courseTitle: string,
  amount: number,
  transactionId: string
) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #fff; 
            margin: 0; 
            padding: 0; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #fff; 
        }
        .header { 
            background: linear-gradient(135deg, #dc2626, #b91c1c); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
            box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
        }
        .header h2 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: bold; 
        }
        .content { 
            padding: 30px 20px; 
            background-color: #f9f9f9; 
            border-left: 4px solid #dc2626;
            border-right: 4px solid #dc2626;
        }
        .content p { 
            color: #333; 
            margin-bottom: 15px; 
            font-size: 16px; 
        }
        .details { 
            margin: 20px 0; 
            padding: 20px; 
            background-color: #f5f5f5; 
            border-radius: 8px; 
            border: 1px solid #ddd; 
        }
        .detail-item { 
            margin-bottom: 12px; 
            font-size: 16px; 
            color: #333; 
        }
        .detail-item strong { 
            color: #dc2626; 
        }
        .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background: linear-gradient(135deg, #dc2626, #b91c1c); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin-top: 20px; 
            font-weight: bold; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
        }
        .button:hover { 
            background: linear-gradient(135deg, #b91c1c, #991b1b); 
            transform: translateY(-2px); 
        }
        .portal-info { 
            margin: 25px 0; 
            padding: 20px; 
            background-color: #f5f5f5; 
            border-radius: 8px; 
            border-left: 4px solid #dc2626; 
        }
        .portal-link { 
            color: #dc2626; 
            text-decoration: none; 
            font-weight: bold; 
            font-size: 16px; 
        }
        .portal-link:hover { 
            text-decoration: underline; 
        }
        .footer { 
            margin-top: 20px; 
            font-size: 14px; 
            text-align: center; 
            color: #666; 
            background-color: #f9f9f9; 
            padding: 20px; 
            border-radius: 0 0 10px 10px; 
            border-left: 4px solid #dc2626;
            border-right: 4px solid #dc2626;
            border-bottom: 4px solid #dc2626;
        }
        .footer p { 
            margin: 8px 0; 
        }
        .helpline { 
            color: #dc2626; 
            font-weight: bold; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎉 Payment Successful!</h2>
        </div>
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Thank you for purchasing <strong style="color: #dc2626;">${courseTitle}</strong> with CADD CORE.</p>
            
            <div class="details">
                <div class="detail-item"><strong>Amount:</strong> ৳${amount.toFixed(2)}</div>
                <div class="detail-item"><strong>Transaction ID:</strong> ${transactionId}</div>
                <div class="detail-item"><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
            
            <div class="portal-info">
                <p><strong style="color: #dc2626;">Important:</strong> Once your payment is successfully completed, we will send your unique Student ID and Password to your registered email address before your official course start date.</p>
                
                <p>After receiving your credentials, please use them to log in to our learning portal to access all your course videos and materials.</p>
                
                <p><strong>Learning Portal:</strong> <a href="https://engineeringitskills.com/" class="portal-link">https://engineeringitskills.com/</a></p>
            </div>
            
           
        </div>
        <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
            <p class="helpline">📞 CADD CORE Helpline: +880 1611-223631 | +880 1611-223637</p>
            <p>© ${new Date().getFullYear()} CADD CORE. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const paymentFailedTemplate = (
  userName: string,
  amount: number,
  transactionId: string
) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background-color: #fff; 
            color: #333; 
            line-height: 1.6; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #fff; 
            border-radius: 15px; 
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: #fff; 
            padding: 30px 25px; 
            text-align: center; 
            position: relative; 
            overflow: hidden; 
        }
        .header::before { 
            content: ''; 
            position: absolute; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); 
            z-index: 1; 
        }
        .header h2 { 
            font-size: 28px; 
            margin: 0; 
            font-weight: 600; 
            position: relative; 
            z-index: 2; 
        }
        .content { 
            padding: 30px 25px; 
            background-color: #f9f9f9; 
            color: #333; 
        }
        .content p { 
            margin-bottom: 15px; 
            font-size: 16px; 
            line-height: 1.7; 
        }
        .details { 
            background-color: #f5f5f5; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            border-left: 4px solid #dc2626; 
            box-shadow: 0 5px 15px rgba(220, 38, 38, 0.1); 
        }
        .detail-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 12px; 
            font-size: 16px; 
        }
        .detail-item:last-child { 
            margin-bottom: 0; 
        }
        .detail-item strong { 
            color: #dc2626; 
            font-weight: 600; 
        }
        .portal-info { 
            background-color: #f5f5f5; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            border-left: 4px solid #dc2626; 
            box-shadow: 0 5px 15px rgba(220, 38, 38, 0.1); 
        }
        .portal-info p { 
            margin-bottom: 12px; 
            font-size: 15px; 
            line-height: 1.6; 
        }
        .portal-link { 
            color: #dc2626; 
            text-decoration: none; 
            font-weight: 600; 
            transition: color 0.3s ease; 
        }
        .portal-link:hover { 
            color: #b91c1c; 
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: #fff; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 10px; 
            font-weight: 600; 
            font-size: 16px; 
            margin-top: 20px; 
            transition: all 0.3s ease; 
            box-shadow: 0 5px 15px rgba(220, 38, 38, 0.3); 
        }
        .button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 20px rgba(220, 38, 38, 0.4); 
        }
        .footer { 
            text-align: center; 
            color: #666; 
            background-color: #f9f9f9; 
            padding: 20px; 
            border-radius: 0 0 10px 10px; 
            border-left: 4px solid #dc2626;
            border-right: 4px solid #dc2626;
            border-bottom: 4px solid #dc2626;
        }
        .footer p { 
            margin: 8px 0; 
        }
        .helpline { 
            color: #dc2626; 
            font-weight: bold; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>❌ Payment Failed</h2>
        </div>
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>We regret to inform you that your payment was not successful.</p>
            
            <div class="details">
                <div class="detail-item"><strong>Amount:</strong> ৳${amount.toFixed(2)}</div>
                <div class="detail-item"><strong>Transaction ID:</strong> ${transactionId}</div>
                <div class="detail-item"><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
            
            <div class="portal-info">
                <p><strong style="color: #dc2626;">Important:</strong> If the amount was deducted from your account but the payment failed, please contact with our support team.</p>
                
                <p>Our support team is available to help you complete your enrollment. Please contact us with your transaction details.</p>
                
               <p><strong>For Support:</strong> https://engineeringitskills.com/</p>

<p><strong>মোবাইল:</strong><br>
+880 1611-223631 | +880 1611-223637
</p>

<p><strong>ইমেইল:</strong><br>
caddcorebd@gmail.com
</p>

<p><strong>WhatsApp:</strong><br>
+880 1611-223637
</p>
            </div>
            
            <p>Please try again or contact our support team for assistance.</p>
            <a href="${process.env.CLIENT_URL}/payment" class="button">Try Payment Again</a>
        </div>
        <div class="footer">
            <p>If you need assistance, please contact our support team.</p>
            <p class="helpline">📞 CADD CORE Helpline: +880 1611-223631 | +880 1611-223637</p>
            <p>© ${new Date().getFullYear()} CADD CORE. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;