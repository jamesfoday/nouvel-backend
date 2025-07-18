const nodemailer = require('nodemailer');

// Configure transporter (using Gmail SMTP as example)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,    // Your email
        pass: process.env.EMAIL_PASS,    // Your email password or app password
    },
});

// Send email function
async function sendEmail(to, subject, text, html = '') {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
        throw error;
    }
}

module.exports = sendEmail;
