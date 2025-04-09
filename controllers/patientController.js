require('dotenv').config(); 
const patientsDetails = require("../data/patients.json");
const {logSearch, getUserSearchCount, isUserVerified} = require('../controllers/patientSearchLoggerController');
const {sendMessage} = require("../functions/messageTemplates");
const { handleUserVerification } = require('./userVerificationController');



const handlePatientLookup = async (to, replyId, userInput) => {

    if (!isUserVerified(to)) {
        
        const isVerified = await handleUserVerification(to, userInput);
        if (!isVerified) {
            await sendMessage(to, "Verification failed. Please try again.");
        } else {
            await sendMessage(to, "You are now verified. Please provide your full name");
        }
        return;
    }

    if (getUserSearchCount(to) >= 5) {
        await sendMessage(to, "You have reached your daily limit of patient searches.");
        return;
    }

    if (!userInput) {
        await sendMessage(to, "Please provide the patient's full name.");
        return;
    }

    const patient = findPatient(userInput);
    if (patient) {
        const patientName = `${patient.first_name} ${patient.last_name}`;
        const allowedSearch = logSearch(to, patientName);

        if (!allowedSearch) {
            await sendMessage(to, "You have reached your daily search limit.");
            return;
        }

        const todayDate = new Date().toISOString().split('T')[0];
        let message = `${patientName} is in ward ${patient.ward}, room ${patient.room_number}, bed ${patient.bed_number}.`;

        if (todayDate > patient.discharge_date) {
            const formattedDate = new Date(patient.discharge_date);
            const dischargeDate = formattedDate.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            message = `${patientName} was discharged on ${dischargeDate}.`;
        } else if (todayDate === patient.discharge_date) {
            message = `${patientName} was discharged today.`;
        }

        message += `\nYou have ${5 - getUserSearchCount(to)} searches remaining today.`;

        await sendMessage(to, message);
    } else {
        await sendMessage(to, "Sorry, we couldn't find a patient with that name.");
    }
};


//find patient based on user input
const findPatient = (input) => {
    if (!input || typeof input !== 'string') {
        console.error("Invalid input:", input);
        return null;
    }

    const formattedName = input.toLowerCase().trim();
    const patientByName = patientsDetails.patients.find(patient => {
       const fullnameWithFirstnameFirst = `${patient.first_name.toLowerCase()} ${patient.last_name.toLowerCase()}`;
       const fullnameWithLastnameFirst =  `${patient.last_name.toLowerCase()} ${patient.first_name.toLowerCase()}`;
       return formattedName === fullnameWithFirstnameFirst || formattedName === fullnameWithLastnameFirst;
    });
    if(patientByName) return patientByName;

    const patientByPartialName = patientsDetails.patients.find(patient => patient.first_name.toLowerCase().includes(formattedName) || patient.last_name.toLowerCase().includes(formattedName));
    if(patientByPartialName) return patientByPartialName;

}


module.exports = {handlePatientLookup};