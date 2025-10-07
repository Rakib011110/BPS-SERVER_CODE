// SMS Templates for BaseMember Interview Updates

export const createMembershipInterviewSMS = (
  userName: string,
  membershipType: string,
  applicationStatus: string,
  interviewDate?: string,
  interviewTime?: string,
  adminNotes?: string
): string => {
  // Get readable membership type
  const membershipTypeMap: { [key: string]: string } = {
    'SENIOR_FELLOW': 'Senior/Fellow',
    'MEMBER': 'Member', 
    'ASSOCIATE_MEMBER': 'Associate Member'
  };
  
  const readableMembershipType = membershipTypeMap[membershipType] || membershipType;
  
  // Get readable status
  const statusMap: { [key: string]: string } = {
    'PENDING': 'Pending Review',
    'APPROVED': 'Approved',
    'REJECTED': 'Not Approved'
  };
  
  const readableStatus = statusMap[applicationStatus] || applicationStatus;
  
  // Base greeting
  let message = `Dear ${userName},\n\nYour ${readableMembershipType} application status: ${readableStatus}`;
  
  // Add interview details if provided
  if (interviewDate && interviewTime) {
    message += `\n\nInterview: ${interviewDate} at ${interviewTime}`;
  } else if (interviewDate) {
    message += `\n\nInterview Date: ${interviewDate}`;
  }
  
  // Add admin notes if provided (keep it short for SMS)
  if (adminNotes && adminNotes.length < 100) {
    message += `\n\nNote: ${adminNotes}`;
  }
  
  // Professional closing
  message += `\n\nBest regards,\nBase Membership Team`;
  
  // Ensure SMS is not too long (SMS limit is usually 160-320 characters)
  if (message.length > 300) {
    // Truncate message if too long
    message = message.substring(0, 280) + '...\n\nBase Membership Team';
  }
  
  return message;
};

// Alternative shorter template for very long content
export const createShortMembershipInterviewSMS = (
  userName: string,
  membershipType: string,
  applicationStatus: string,
  interviewDate?: string
): string => {
  const statusMap: { [key: string]: string } = {
    'PENDING': 'Pending',
    'APPROVED': 'Approved', 
    'REJECTED': 'Rejected'
  };
  
  const membershipTypeMap: { [key: string]: string } = {
    'SENIOR_FELLOW': 'Senior',
    'MEMBER': 'Member',
    'ASSOCIATE_MEMBER': 'Associate'
  };
  
  const status = statusMap[applicationStatus] || applicationStatus;
  const type = membershipTypeMap[membershipType] || membershipType;
  
  let message = `Dear ${userName}, your ${type} membership is ${status}.`;
  
  if (interviewDate) {
    message += ` Interview: ${interviewDate}.`;
  }
  
  message += ` Check email for details. -Base Membership`;
  
  return message;
};

// Template for specific status updates
export const createStatusSpecificSMS = (
  userName: string,
  membershipType: string,
  applicationStatus: string,
  interviewDate?: string,
  interviewTime?: string
): string => {
  const membershipTypeMap: { [key: string]: string } = {
    'SENIOR_FELLOW': 'Senior/Fellow',
    'MEMBER': 'Member',
    'ASSOCIATE_MEMBER': 'Associate Member'
  };
  
  const readableMembershipType = membershipTypeMap[membershipType] || membershipType;
  
  switch (applicationStatus) {
    case 'PENDING':
      return `Dear ${userName}, your ${readableMembershipType} application is under review. We'll notify you soon.\n\nBest regards,\nBase Membership Team`;
      
    case 'APPROVED':
      let approvedMsg = `Congratulations ${userName}! Your ${readableMembershipType} application is APPROVED.`;
      if (interviewDate && interviewTime) {
        approvedMsg += `\n\nInterview: ${interviewDate} at ${interviewTime}`;
      } else if (interviewDate) {
        approvedMsg += `\n\nInterview: ${interviewDate}`;
      }
      approvedMsg += `\n\nWelcome to Base Membership!`;
      return approvedMsg;
      
    case 'REJECTED':
      return `Dear ${userName}, your ${readableMembershipType} application was not approved. You may reapply in the future.\n\nBest regards,\nBase Membership Team`;
      
    default:
      return createMembershipInterviewSMS(userName, membershipType, applicationStatus, interviewDate, interviewTime);
  }
};

export default {
  createMembershipInterviewSMS,
  createShortMembershipInterviewSMS,
  createStatusSpecificSMS
};
