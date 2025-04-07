require("dotenv").config();
const { sendMessage, sendSelectTimeMessage, sendAppointmentConfirmation } = require("../functions/messageTemplates");
const { isUserVerified } = require("./patientSearchLoggerController");
const { handleUserVerification } = require("./userVerificationController");
const dayjs = require("dayjs");

const pendingAppointments = new Map();

const handleAppointmentBooking = async (to, userInput) => {
    let appointments = pendingAppointments.get(to) || { step: 1 };

    if (appointments.step === 1) {
        if (!isUserVerified(to)) {
            await handleUserVerification(to, userInput);
            pendingAppointments.set(to, { step: 2 }); // Only move to Step 2 after verification
            return;
        } else {
            // Proceed directly to Step 2 if already verified
            console.log("User is verified, proceeding to full name request.");
            await sendMessage(to, "Please enter your full name.");
            pendingAppointments.set(to, { step: 2 }); // Correctly setting to Step 2
            return;
        }
    }

    if (appointments.step === 2) {
        appointments.fullname = userInput;
        await sendMessage(to, "Please enter your ID number.");
        pendingAppointments.set(to, { ...appointments, step: 3 });
        return;
    }

    if (appointments.step === 3) {
        appointments.idNumber = userInput;
        await sendMessage(to, "Please enter your phone number.");
        pendingAppointments.set(to, { ...appointments, step: 4 });
        return;
    }

    const formatPhoneNumber = (phoneNumber) => {
        return phoneNumber.replace(/\D/g, '');
    }

    if (appointments.step === 4) {
        
        appointments.phoneNumber = formatPhoneNumber(userInput);
        await sendMessage(to, "Please enter appointment date (DD-MM-YYYY).");
        pendingAppointments.set(to, { ...appointments, step: 5 });
        return;
    }

    if (appointments.step === 5) {
        const formattedDate = dayjs(userInput, 'DD-MM-YYYY').format('YYYY-MM-DD');

        if(!dayjs(formattedDate).isValid()){
            await sendMessage(to, "Invalid date format. Please enter date in DD-MM-YYYY format"); 
            return;
        }
        appointments.date = formattedDate;
        await sendSelectTimeMessage(to);
        pendingAppointments.set(to, { ...appointments, step: 6 });
        return;
    }

    if (appointments.step === 6) {
        appointments.time = userInput;
        console.log("Appointment details:", appointments);
        await sendAppointmentConfirmation(to, appointments);
        return;
    }
};


module.exports = { handleAppointmentBooking, pendingAppointments };
