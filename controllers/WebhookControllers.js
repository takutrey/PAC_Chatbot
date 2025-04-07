require('dotenv').config();
const { sendMessage, sendWelcomeMessage, sendAppointmentConfirmation, sendAdmissionType } = require('../functions/messageTemplates');
const { handlePatientLookup } = require('./patientController');
const { handleUserVerification } = require('./userVerificationController');
const { isUserVerified } = require('./patientSearchLoggerController');
const greetings = require('../data/greetings.json');
const { handleAppointmentBooking, pendingAppointments } = require('./appointmentBookingController');
const { handleSelfPatientAdmission, handleDoctorPatientAdmission, pendingAdmissions } = require('./patientAdmissionController');


const userContextState = new Map(); // Store user context state
const processedMessages = new Set();


const getWebhook = (req, res) =>{
    const challenge = req.query['hub.challenge'];
    const verify_token = req.query['hub.verify_token'];

    if(verify_token === process.env.VERIFY_TOKEN){
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
}

const postWebhook = async (req, res) => {
    try {
        const entry = req.body.entry?.[0];
        if (!entry || !entry.changes) {
            return res.sendStatus(200);
        }

        const changes = entry.changes?.[0]?.value;
        if (!changes) {
            console.log("No valid changes found.");
            return res.sendStatus(200);
        }

        if (changes.messages) {
            const message = changes.messages?.[0];
            if (message) {
                const from = message.from;
                const body = message.text?.body;
                const messageId = message.id;                     
                const interactive = changes.messages?.[0]?.interactive;
                const replyId = interactive?.button_reply?.id;
                const listReplyId = interactive?.list_reply?.id; 
                const listReplyTitle = interactive?.list_reply?.title;
                const hasPendingAppointment = pendingAppointments.has(from); 
                const hasPendingAdmission = pendingAdmissions.has(from);
                
                
                // Prevent duplicate processing as before
                if (processedMessages.has(messageId)) {
                    console.warn(`Skipping duplicate messages ${messageId}`);
                    return res.sendStatus(200);
                } 
                processedMessages.add(messageId);
                
                // Handle interactive button clicks - SET CONTEXT
                if (interactive) {
                    if(listReplyId && listReplyId.startsWith("slot_")){
                        const appointment = pendingAppointments.get(from);
                        if(appointment && appointment.step === 6){
                            appointment.time = listReplyTitle;
                            console.log("Final appointment details", appointment); 
                            await sendAppointmentConfirmation(from, appointment);
                            
                        } else {
                            console.log("Error"); 
                            await sendMessage('Something went wrong. Please restart your appointment booking')
                        }

                        return res.sendStatus(200);
                    } 

                    if(replyId === "confirm_appointment"){
                        const appointment = pendingAppointments.get(from); 
                        if(appointment){
                            console.log("Finalizing appointment", appointment); 
                            await sendMessage(from, `Your appointment is booked for ${appointment.date} at ${appointment.time}`);
                            pendingAppointments.delete(from);
                        }
                        return res.sendStatus(200);
                    }

                    if(replyId === "cancel_appointment"){
                        pendingAppointments.delete(from); 
                        await sendMessage(from, "Appointment is cancelled."); 
                        return res.sendStatus(200);
                    }

                    if(replyId === "confirm_admission_request"){
                        const admission = pendingAdmissions.get(from); 
                        if(admission){
                            console.log("Finalizing admission request", admission); 
                            await sendMessage(from,`Admission request for ${admission.fullname} sent`);
                            pendingAdmissions.delete(from);
                        }
                        return res.sendStatus(200);
                    }

                    if(replyId === "cancel_admission_request"){
                        pendingAdmissions.delete(from); 
                        await sendMessage(from, "Admission request cancelled."); 
                        return res.sendStatus(200);
                    }

                    if (replyId === "patient_lookup") {
                        userContextState.set(from, "awaiting_patient_details");
                        if (isUserVerified(from)) {
                            await sendMessage(from, "Please enter the patient's name");
                        } else {
                            userContextState.set(from, "awaiting_verification");
                            await handleUserVerification(from, body);
                        }
                        return res.sendStatus(200);
                    } else if (replyId === "make_appointment") {
                        userContextState.set(from, "awaiting_appointment_details");
                        if (isUserVerified(from)) {
                            await handleAppointmentBooking(from, body, 1);
                        } else {
                            userContextState.set(from, "awaiting_verification");
                            await handleUserVerification(from, body);
                        }
                        return res.sendStatus(200);
                    } else if(replyId === "request_admission") {
                        await sendAdmissionType(from);
                        userContextState.set(from, "awaiting_admission_details"); 

                        return res.sendStatus(200);
                       
                    } else if(replyId === "self_request"){
                        userContextState.set(from, "self_admission_flow");
                        await handleSelfPatientAdmission(from, replyId);
                        return res.sendStatus(200);
                    } else if(replyId === "doctor_request"){
                        userContextState.set(from, "doctor_request_flow"); 
                        await handleDoctorPatientAdmission(from, replyId);
                        return res.sendStatus(200);
                    }
         
                } else if(hasPendingAppointment && body) {
                    console.log("Continuing with appointment booking process");
                    await handleAppointmentBooking(from, body, 1); // Continue with appointment booking
                    return res.sendStatus(200);

                } else if(hasPendingAdmission && body){
                    console.log("Continuing with patient admission");
                    const userContext = userContextState.get(from);
                    if(userContext === "self_admission_flow"){
                        await handleSelfPatientAdmission(from, body); 
                        return;
                    } else if(userContext === "doctor_request_flow"){
                        await handleDoctorPatientAdmission(from, body);
                        return;
                    } 
                }
                // Handle text inputs based on context
                else if (body) {
                    // Check greetings first
                    if (!hasPendingAdmission && !hasPendingAppointment && body && greetings.includes(body)) {
                        userContextState.delete(from); // Reset context
                        console.log("Sending greetings message");
                        sendWelcomeMessage(from, "Hello! How can I assist you today?");
                        return res.sendStatus(200);
                    }
                    
                    // Process based on user's current context
                    const userContext = userContextState.get(from);
                    if (userContext === "awaiting_patient_details") {
                        if (isUserVerified(from)) {
                            await handlePatientLookup(from, null, body);
                        } else {
                            await handleUserVerification(from, body);
                        }
                        return res.sendStatus(200);
                    } 
                    else if (userContext === "awaiting_appointment_details") {
                        if (isUserVerified(from)) {
                            await handleAppointmentBooking(from, body, 1);
                            userContextState.delete(from); // Reset after completion
                        } else {
                            await handleUserVerification(from, body);
                        }
                        return res.sendStatus(200);
                    }
                    else if (userContext === "awaiting_verification") {
                        await handleUserVerification(from, body);
                        return res.sendStatus(200);
                    } else if(userContext === "awaiting_admission_details"){
                        if(body.toLowerCase().includes("self")){
                            userContextState.set(from, "self_admission_flow"); 
                            await handleSelfPatientAdmission(from, "self_request"); 
                            
                        } else if(body.toLowerCase().includes("doctor")){
                            userContextState.set(from, "doctor_request_flow"); 
                            await handleDoctorPatientAdmission(from, "doctor_request"); 
                            
                        } else {
                            await sendMessage(from, "Please select either self request or doctor request");
                            await sendAdmissionType(from);
                            
                        }

                        return res.sendStatus(200);

                    }
                    // No active context, send welcome message
                    else {
                        console.log("Sending default message - no active context");
                        sendWelcomeMessage(from, "Hello! How can I assist you today?");
                        return res.sendStatus(200);
                    }
                }
            }
        }

        // ✅ Handle Status Updates (Sent, Delivered, Read)
        if (changes.statuses) {
            const status = changes.statuses?.[0];
            if (status) {
                console.log(`Message Status: ${status.status} (ID: ${status.id}) for ${status.recipient_id}`);
                if (status.status === "read") {
                    console.log(`Message ${status.id} was read by ${status.recipient_id} at ${status.timestamp}`);
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        res.sendStatus(500);
    }
};



module.exports = {getWebhook, postWebhook};