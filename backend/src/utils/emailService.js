const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter
const createTransporter = () => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error('Email configuration is missing');
        }

        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    } catch (error) {
        logger.error('Failed to create email transporter:', error);
        throw error;
    }
};

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version of email
 * @param {string} [options.html] - HTML version of email (optional)
 */
async function sendEmail(options) {
    try {
        logger.info('Attempting to send email to:', options.to);

        const transporter = createTransporter();
        
        const mailOptions = {
            from: {
                name: 'Menu App',
                address: process.env.EMAIL_FROM
            },
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.text
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info('Email sent successfully', { 
            messageId: info.messageId,
            to: options.to,
            subject: options.subject
        });
        
        return info;
    } catch (error) {
        logger.error('Failed to send email:', {
            error: error.message,
            to: options.to,
            subject: options.subject
        });
        throw new Error(`Failed to send email: ${error.message}`);
    }
}

module.exports = { sendEmail }; 