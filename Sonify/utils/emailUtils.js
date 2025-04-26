// emailUtils.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateValidationEmail } from './validateEmailTemplate.js';

dotenv.config();
const smtpHost = process.env.MAILGUN_SMTP_HOST;
const smtpPort = process.env.MAILGUN_SMTP_PORT;
const smtpLogin = process.env.MAILGUN_SMTP_LOGIN;
const smtpPassword = process.env.MAILGUN_SMTP_PASSWORD;

const mailgunFromEmail = process.env.MAILGUN_FROM_EMAIL || smtpLogin;

if (!smtpHost || !smtpPort || !smtpLogin || !smtpPassword) {
  console.error(
    'ERROR: Mailgun SMTP configuration missing. Ensure MAILGUN_SMTP_HOST, MAILGUN_SMTP_PORT, MAILGUN_SMTP_LOGIN, and MAILGUN_SMTP_PASSWORD are set in your .env file.'
  );
}

let transporter;
if (smtpHost && smtpPort && smtpLogin && smtpPassword) {
  const portNumber = parseInt(smtpPort, 10);

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: portNumber,
    secure: portNumber === 465,
    auth: {
      user: smtpLogin, 
      pass: smtpPassword, 
    },
  });

  console.log(`📧 Nodemailer SMTP transporter configured for host: ${smtpHost}:${portNumber}`);

} else {
   console.warn('⚠️ Mailgun SMTP transporter NOT configured due to missing environment variables.');
}


export const sendValidationEmail = async ({
  username,
  validateURL,
  toEmail,
  logoUrl, 
  companyName = 'Sonify', 
}) => {
  if (!transporter) {
     const errorMsg = 'SMTP transporter is not configured. Cannot send email.';
     console.error(`ERROR: ${errorMsg}`);
     return Promise.reject(new Error(errorMsg));
  }

  if (!username || !validateURL || !toEmail) {
    const errorMsg = 'Missing required parameters: username, validateURL, or toEmail.';
    console.error(`ERROR: ${errorMsg}`);
    return Promise.reject(new Error(errorMsg));
  }

  console.log(`Attempting to send validation email to: ${toEmail} via SMTP`);

  const emailHtml = generateValidationEmail({
    username,
    validateURL,
    logoUrl,
    companyName,
  });

  const mailOptions = {
    from: mailgunFromEmail, 
    to: toEmail,
    subject: `Please Validate Your ${companyName} Account`,
    html: emailHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Validation email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
    console.log('SMTP Response:', info.response);
    return info; 
  } catch (error) {
    console.error(`Error sending validation email to ${toEmail} via SMTP:`, error);
    if (error.code) {
        console.error(`SMTP Error Code: ${error.code}`);
    }
     if (error.responseCode) {
        console.error(`SMTP Response Code: ${error.responseCode}`);
    }
    if (error.command) {
        console.error(`SMTP Command: ${error.command}`);
    }
    throw error; 
  }
};
