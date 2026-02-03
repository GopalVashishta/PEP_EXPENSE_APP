const nodemailer = require('nodemailer');
const emailClient = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
    }
})

const emailServices = {
    send: async (to, subject, body) => {
        try{
            const emailOptions = {
                from: process.env.GOOGLE_EMAIL,
                to: to,
                subject: subject,
                text: body
            }
            await emailClient.sendMail(emailOptions);
            console.log("Email sent successfully to ", to);
        }
        catch(err){
            console.log("Error sending email:", err);
        }
    },
}
module.exports = emailServices;