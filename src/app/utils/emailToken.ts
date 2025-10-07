// utils/emailToken.ts

import crypto from 'crypto';
// aaa
export const generateEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};