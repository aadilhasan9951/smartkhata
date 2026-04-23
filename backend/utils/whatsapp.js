const twilio = require('twilio');

// Send WhatsApp message
const sendWhatsAppMessage = async (to, message) => {
  // Check if Twilio credentials are configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.log(`\n========== WHATSAPP NOT CONFIGURED ==========`);
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log(`To enable WhatsApp, configure TWILIO_WHATSAPP_NUMBER in .env file`);
    console.log(`===================================================\n`);
    return { success: true, message: 'WhatsApp not configured (console mode)' };
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });

    console.log(`WhatsApp message sent successfully to ${to}`);
    return { success: true, message: 'WhatsApp sent successfully' };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return { success: false, error: error.message };
  }
};

// Send payment reminder
const sendPaymentReminder = async (to, customerName, amount, businessName) => {
  const message = `📢 *Payment Reminder*\n\nDear ${customerName},\n\nYou have an outstanding balance of ₹${amount.toFixed(2)} with ${businessName}.\n\nPlease clear your payment at your earliest convenience.\n\nThank you!`;
  
  return await sendWhatsAppMessage(to, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendPaymentReminder
};
