require('dotenv').config();
const axios = require('axios');
const ACCESS_TOKEN =process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;


//welcome message template
// This function sends a welcome message to the user when they first interact with the bot.
const sendWelcomeMessage = async(to) => {
    try{
        const response = await axios.post(
            process.env.WHATSAPP_API_URL,
            {
                "messaging_product": "whatsapp",
                "to":to,
                'type': "interactive",
                'interactive': {
                    "type": "button",
                    "body": {
                        "text": "Welcome to Avenues Private Clinic Whatsapp Chatbot. How may I assist you today?"
                    },
                    "header": {
                        "type": "image",
                        "image": {
                            'link': "https://avenuesclinic.co.zw/wp-content/uploads/2021/09/68813627_1181744942017923_6166627719049117696_n-300x183.jpg"
                        }
                    },
                    "action": {
                        "buttons": [
                            {
                                "type": "reply",
                                "reply": {
                                    "id": "patient_lookup",
                                    "title": "Patient Lookup"
                                }
                            }, 
                          
                            { 
                                "type": "reply", 
                                "reply": {
                                    "id": "make_appointment", 
                                    "title": "Make an appointment"
                                }
                            }
                        ]
                    }
                }
            },
            {
                "headers": {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        ); 

        console.log("Message sent", response.data);

    } catch(error){
        console.error("Error sending message", error.response?.data || error.message);

    }
}

// This function sends a message to the user. It can be used for various purposes, such as sending reminders or notifications.
// The function takes the recipient's phone number and the message as parameters.
const sendMessage = async(to, message) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                "messaging_product": "whatsapp",
                "to": to,
                "type": "text",
                "text": {
                    "body": message
                }
            
            },
            {
                "headers": {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("Message sent", response.data);
        
    } catch (error) {
        console.error("Error sending message", error.response?.data || error.message);
        
    }
}

//send list message
const sendSelectTimeMessage = async(to) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                "messaging_product": "whatsapp",
                "to": to,
                "type": "interactive",
                "interactive": {
                    "type": "list",
                    "body": {
                        "text": "Please select a time for your appointment."
                    },
                    "action": {
                        "button": "Tap to select time",
                        "sections": [
                            {
                                "title": "Available Times",
                                "rows": [
                                    {
                        "id": "slot_800",
                        "title": "8:00 AM"
                                    },
                                    {
                        "id": "slot_900",
                        "title": "9:00 AM"
                                    },
                                    {
                        "id": "slot_1000",
                        "title": "10:00 AM"
                                    },

                                    {
                        "id": "slot_1100",
                        "title": "11:00 AM"
                                    },

                                    {
                        "id": "slot_1200",
                        "title": "12:00 PM"
                                    },

                                    {
                        "id": "slot_1300",
                        "title": "1:00 PM"
                             },
                    
                                    {
                        "id": "slot_1400",
                        "title": "2:00 PM"
                                    },
                                
                                    {
                        "id": "slot_1500",
                        "title": "3:00 PM"
                                    },
                                    {
                        "id": "slot_1600",
                        "title": "4:00 PM"
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        )
        
    } catch (error) {
        console.error("Error sending message", error.response?.data || error.message);
        
    }
}

const sendAppointmentConfirmation = async(to, appointment) => {
    try {
         const response = await axios.post(
            WHATSAPP_API_URL,
            {
              messaging_product: "whatsapp",
              to: to,
              type: "interactive",
              interactive: {
                type: "button",
                body: {
                  text: `📋 *Confirm your appointment details:*
          
                        *Name:* ${appointment.fullname}
                        *ID Number:* ${appointment.idNumber}
                        *Phone:* ${appointment.phoneNumber}
                        *Date:* ${appointment.date}
                        *Time:* ${appointment.time}`
                },
                action: {
                  buttons: [
                    {
                      type: "reply",
                      reply: {
                        id: "confirm_appointment",
                        title: "✅ Confirm"
                      }
                    },
                    {
                      type: "reply",
                      reply: {
                        id: "cancel_appointment",
                        title: "❌ Cancel"
                      }
                    }
                  ]
                }
              }
            },
            {
              headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json"
              }
            }
          );
        
    } catch (error) {
        console.log("Error sending confirmation message", error.response?.data || error.message);
        
    }
}

const sendAdmissionType = async(to) => {

    try {
        await axios.post(
            WHATSAPP_API_URL, 
            {
                "messaging_product": "whatsapp", 
                "to": to, 
                "type": "interactive", 
                "interactive": {
                    "type": "button",
                    "body": {
                        "text": "Please select an option from below."
                    }, 
                    "action": {
                        "buttons": [
                            {
                                "type": 'reply', 
                                "reply": {
                                    "id": "self_request", 
                                    "title": "Self Request"
                                }
                                
                            },
                            {
                                "type": "reply", 
                                "reply": {
                                    "id": "doctor_request", 
                                    "title": "Doctor's Request"
                                }
                            }
                        ]
                    }
                }
            }, 
            {
                "headers": {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`, 
                    "Content-Type": "application/json" 
                }
            }
        );
        
    } catch (error) {
        console.log("Error sending confirmation message", error.response?.data || error.message);     
    }
    
}

const sendAdmissionConfirmation = async(to, admission) => {
    try {
         const response = await axios.post(
            WHATSAPP_API_URL,
            {
              messaging_product: "whatsapp",
              to: to,
              type: "interactive",
              interactive: {
                type: "button",
                body: {
                  text: `📋 *Confirm your admission details:*
          
                        *Name:* ${admission.firstname} ${admission.lastname}
                        *Gender:* ${admission.gender}
                        *Date of Birth:* ${admission.dob}
                        *Phone:* ${admission.phoneNumber}
                        *Reason for admission:* ${admission.admissionReason}
                        `
                },
                action: {
                  buttons: [
                    {
                      type: "reply",
                      reply: {
                        id: "confirm_admission_request",
                        title: "✅ Confirm"
                      }
                    },
                    {
                      type: "reply",
                      reply: {
                        id: "cancel_admission_request",
                        title: "❌ Cancel"
                      }
                    }
                  ]
                }
              }
            },
            {
              headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json"
              }
            }
          );
        
    } catch (error) {
        console.log("Error sending confirmation message", error.response?.data || error.message);
        
    }
}



module.exports = {sendWelcomeMessage, sendMessage, sendSelectTimeMessage, sendAppointmentConfirmation, sendAdmissionType, sendAdmissionConfirmation};
