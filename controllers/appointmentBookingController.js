require("dotenv").config();
const { sendMessage, sendSelectTimeMessage, sendAppointmentConfirmation } = require("../functions/messageTemplates");
const { isUserVerified } = require("./patientSearchLoggerController");
const { handleUserVerification } = require("./userVerificationController");
const dayjs = require("dayjs");

const pendingAppointments = new Map();

const handleAppointmentBooking = async (to, userInput) => {
    let appointments = pendingAppointments.get(to) || { step: 1 };

    const nameValidation = (name) => {
        return name && typeof name === 'string' && name.trim().length >= 2;
    };

    // ID number validation function with custom pattern
    const validateIdNumber = (idNumber) => {
        // Custom ID number pattern: two digits, a hyphen, 6-7 digits, a space, a letter, and two digits
        const idPattern = /^\d{2}-\d{6,7} [A-Za-z] \d{2}$/;
    
        if (!idPattern.test(idNumber)) {
            return "Invalid ID number. Please enter in the format XX-XXXXXX X XX.";
        }
    
        return null; // Return null if the ID number is valid
    };

    if (appointments.step === 1) {
        if (!isUserVerified(to)) {
            await handleUserVerification(to, userInput);
            pendingAppointments.set(to, { step: 2 }); // Only move to Step 2 after verification
            return;
        } else {
            // Proceed directly to Step 2 if already verified
            console.log("User is verified, proceeding to first name and last name request.");
            await sendMessage(to, "Please enter your first name.");
            pendingAppointments.set(to, { step: 2 }); // Correctly setting to Step 2
            return;
        }
    }

    if (appointments.step === 2) {
        if(!nameValidation(userInput)){
            await sendMessage("Please enter a valid first name with at least 2 characters");
            return;
        }
        appointments.firstName = userInput.trim();
        await sendMessage(to, "Please enter your last name.");
        pendingAppointments.set(to, { ...appointments, step: 3 });
        return;
    }

    if (appointments.step === 3) {
        if(!nameValidation(userInput)){
            await sendMessage("Please enter a valid first name with at least 2 characters"); 
            return;
        }
        appointments.lastName = userInput.trim();
        await sendMessage(to, "Please enter your ID number.");
        pendingAppointments.set(to, { ...appointments, step: 4 });
        return;
    }

    if (appointments.step === 4) {
        if(!validateIdNumber(userInput)){
            await sendMessage(to, "Please enter ID number in the format xx-xxxxx x xx");
            return;
        }
        appointments.idNumber = userInput;
        await sendMessage(to, "Please enter your phone number.");
        pendingAppointments.set(to, { ...appointments, step: 5 });
        return;
    }

    const formatPhoneNumber = (phoneNumber) => {
        return phoneNumber.replace(/\D/g, '');
    }

    if (appointments.step === 5) {
        appointments.phoneNumber = formatPhoneNumber(userInput);
        await sendMessage(to, "Please enter appointment date (DD-MM-YYYY).");
        pendingAppointments.set(to, { ...appointments, step: 6 });
        return;
    }

    if (appointments.step === 6) {
        const formattedDate = dayjs(userInput, 'DD-MM-YYYY').format('YYYY-MM-DD');

        if (!dayjs(formattedDate).isValid()) {
            await sendMessage(to, "Invalid date format. Please enter date in DD-MM-YYYY format");
            return;
        }
        appointments.date = formattedDate;
        await sendSelectTimeMessage(to);
        pendingAppointments.set(to, { ...appointments, step: 7 });
        return;
    }

    if (appointments.step === 7) {
        appointments.time = userInput;
        console.log("Appointment details:", appointments);
        await sendAppointmentConfirmation(to, appointments);
        return;
    }
};

module.exports = { handleAppointmentBooking, pendingAppointments };
