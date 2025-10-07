export const membershipInterviewUpdateTemplate = (
  userName: string,
  membershipType: string,
  applicationStatus: string,
  interviewDate?: string,
  interviewTime?: string,
  adminNotes?: string
) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background-color: #f8fafc; 
            color: #333; 
            line-height: 1.5; 
        }
        .container { 
            max-width: 500px; 
            margin: 20px auto; 
            background-color: #fff; 
            border-radius: 10px; 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
            color: #fff; 
            padding: 20px; 
            text-align: center; 
        }
        .header h2 { 
            font-size: 20px; 
            margin: 0; 
            font-weight: 600; 
        }
        .content { 
            padding: 20px; 
        }
        .greeting { 
            font-size: 16px; 
            font-weight: 600; 
            color: #1f2937; 
            margin-bottom: 15px; 
        }
        .main-text { 
            color: #4b5563; 
            margin-bottom: 20px; 
            font-size: 14px;
        }
        .interview-highlight { 
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            border: 2px solid #10b981; 
            text-align: center;
        }
        .interview-highlight h3 { 
            color: #065f46; 
            margin-bottom: 12px; 
            font-size: 18px;
            font-weight: 700;
        }
        .interview-date { 
            color: #047857; 
            font-size: 16px; 
            font-weight: 600;
            margin: 5px 0;
        }
        .simple-info { 
            background-color: #f9fafb; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 15px 0; 
            border-left: 3px solid #3b82f6; 
        }
        .info-line { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            font-size: 14px; 
        }
        .info-line:last-child { margin-bottom: 0; }
        .info-label { 
            font-weight: 600; 
            color: #374151; 
        }
        .info-value { 
            color: #1f2937; 
            font-weight: 500;
        }
        .status-badge { 
            padding: 4px 10px; 
            border-radius: 15px; 
            font-size: 12px; 
            font-weight: 600; 
            text-transform: uppercase; 
        }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-approved { background-color: #d1fae5; color: #065f46; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; }
        .status-interview_scheduled { background-color: #e9d5ff; color: #7c2d12; }
        .notes { 
            background-color: #fffbeb; 
            padding: 12px; 
            border-radius: 6px; 
            margin: 15px 0; 
            border-left: 3px solid #f59e0b; 
            font-size: 14px;
            color: #92400e;
        }
        .footer { 
            text-align: center; 
            color: #6b7280; 
            background-color: #f9fafb; 
            padding: 15px; 
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
        }
        .footer p { margin: 4px 0; }
        .helpline { color: #3b82f6; font-weight: 600; }
        @media (max-width: 600px) {
            .container { margin: 10px; }
            .info-line { flex-direction: column; }
            .info-value { margin-top: 2px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>� Membership Application Update</h2>
        </div>
        <div class="content">
            <p class="greeting">Dear ${userName},</p>
            <p class="main-text">We hope this email finds you well. We are writing to update you regarding your <strong>Base Membership Application</strong>.</p>
            
            ${interviewDate ? `
            <div class="interview-highlight">
                <h3>🎯 Interview Scheduled</h3>
                <div class="interview-date">${interviewDate}</div>
                ${interviewTime ? `<div class="interview-date">${interviewTime}</div>` : ''}
            </div>
            ` : ''}

            <div class="simple-info">
                <div class="info-line">
                    <span class="info-label">Application Status:</span>
                    <span class="info-value">
                        <span class="status-badge status-${applicationStatus.toLowerCase().replace(/_/g, '_')}">
                            ${applicationStatus.replace(/_/g, ' ')}
                        </span>
                    </span>
                </div>
                <div class="info-line">
                    <span class="info-label">Membership Type:</span>
                    <span class="info-value">${membershipType.replace(/_/g, ' ')}</span>
                </div>
            </div>

            ${adminNotes ? `
            <div class="notes">
                <strong>📝 Note:</strong> ${adminNotes}
            </div>
            ` : ''}

            <p class="main-text">
                ${applicationStatus.toLowerCase() === 'interview_scheduled' 
                    ? 'Please attend your scheduled interview at the specified date and time.'
                    : applicationStatus.toLowerCase() === 'approved'
                    ? 'Congratulations! Your membership application has been approved.'
                    : applicationStatus.toLowerCase() === 'pending'
                    ? 'Your application is under review. We will update you soon.'
                    : 'Please contact support for more information about your application.'
                }
            </p>
            
            <p class="main-text">If you have any questions or concerns regarding your application, please don't hesitate to contact our support team.</p>
        </div>
        
        <div class="footer">
            <p>BASE Membership </p>
            <p class="helpline">📞 +880 1611-223631 | 📧 support@basemembership.com</p>
        </div>
    </div>
</body>
</html>
`;

export const referenceRequestTemplate = (
  referenceMemberName: string,
  applicantName: string,
  applicantEmail: string,
  membershipType: string,
  loginUrl: string = 'https://yourdomain.com/login'
) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background-color: #f8fafc; 
            color: #333; 
            line-height: 1.6; 
        }
        .container { 
            max-width: 500px; 
            margin: 20px auto; 
            background-color: #fff; 
            border-radius: 10px; 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
            color: #fff; 
            padding: 20px; 
            text-align: center; 
        }
        .header h2 { 
            font-size: 20px; 
            margin: 0; 
            font-weight: 600; 
        }
        .content { 
            padding: 20px; 
        }
        .greeting { 
            font-size: 16px; 
            font-weight: 600; 
            color: #1f2937; 
            margin-bottom: 15px; 
        }
        .main-text { 
            color: #4b5563; 
            margin-bottom: 15px; 
            font-size: 14px;
        }
        .applicant-highlight { 
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            border: 2px solid #3b82f6; 
        }
        .applicant-highlight h3 { 
            color: #1e40af; 
            margin-bottom: 12px; 
            font-size: 16px;
            font-weight: 700;
        }
        .info-line { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            font-size: 14px; 
        }
        .info-line:last-child { margin-bottom: 0; }
        .info-label { 
            font-weight: 600; 
            color: #374151; 
        }
        .info-value { 
            color: #1f2937; 
            font-weight: 500;
        }
        .action-section { 
            background-color: #f0fdf4; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            border: 2px solid #22c55e; 
            text-align: center;
        }
        .action-section h3 { 
            color: #166534; 
            margin-bottom: 12px; 
            font-size: 16px;
            font-weight: 700;
        }
        .login-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); 
            color: white; 
            padding: 12px 24px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 600; 
            margin: 10px 0;
            font-size: 14px;
        }
        .login-button:hover { 
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); 
        }
        .instructions { 
            background-color: #fef3c7; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 15px 0; 
            border-left: 3px solid #f59e0b; 
            font-size: 13px;
            color: #92400e;
        }
        .footer { 
            text-align: center; 
            color: #6b7280; 
            background-color: #f9fafb; 
            padding: 15px; 
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
        }
        .footer p { margin: 4px 0; }
        .helpline { color: #3b82f6; font-weight: 600; }
        @media (max-width: 600px) {
            .container { margin: 10px; }
            .info-line { flex-direction: column; }
            .info-value { margin-top: 2px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>👥 Reference Request for BASE Membership</h2>
        </div>
        <div class="content">
            <p class="greeting">Dear ${referenceMemberName},</p>
            <p class="main-text">We hope this email finds you well. A fellow BASE member has requested you to provide a reference for their membership application.</p>
            
            <div class="applicant-highlight">
                <h3>📋 Applicant Information</h3>
                <div class="info-line">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${applicantName}</span>
                </div>
                <div class="info-line">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${applicantEmail}</span>
                </div>
                <div class="info-line">
                    <span class="info-label">Membership Type:</span>
                    <span class="info-value">${membershipType.replace(/_/g, ' ')}</span>
                </div>
            </div>

            <div class="action-section">
                <h3>🎯 Action Required</h3>
                <p style="color: #166534; margin-bottom: 15px; font-size: 14px;">
                    Please log in to your BASE account to approve or decline this reference request.
                </p>
                <a href="${loginUrl}" class="login-button">
                    🔐 Login to Respond
                </a>
            </div>

            <div class="instructions">
                <strong>📝 Instructions:</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>Log in to your BASE member account</li>
                    <li>Navigate to "Reference Requests" section</li>
                    <li>Review the applicant's information</li>
                    <li>Approve or decline the reference request</li>
                </ul>
            </div>

            <p class="main-text">
                Your reference helps maintain the quality and standards of BASE membership. Please only approve references for individuals you personally know and can recommend.
            </p>
            
            <p class="main-text">
                <strong>Note:</strong> This request will expire in 30 days if no response is provided.
            </p>
        </div>
        
        <div class="footer">
            <p>BASE Membership Committee</p>
            <p class="helpline">📞 +880 1611-223631 | 📧 support@basemembership.com</p>
        </div>
    </div>
</body>
</html>
`;
