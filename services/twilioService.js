const twilio = require('twilio');

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const fromPhone = process.env.TWILIO_PHONE;

const sendOrderNotification = async (customerInfo, totalAmount) => {
    const message = `Congratulations! New order arrived!\nMr/Mrs ${customerInfo.name} with Rs. ${totalAmount}.\nDo check www.jprcrackers.com/admin for further details. Thank you!`;

    return client.messages.create({
        body: message,
        from: fromPhone,
        to: '+91 63803 31212', // You can also pass this dynamically if needed
    });
};

module.exports = sendOrderNotification;
