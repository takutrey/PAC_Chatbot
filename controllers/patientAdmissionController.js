const { sendMessage, sendAdmissionConfirmation } = require("../functions/messageTemplates");
const { isUserVerified } = require("./patientSearchLoggerController");
const { handleUserVerification } = require("./userVerificationController");


const pendingAdmissions  = new Map(); 

const handleSelfPatientAdmission = async(to, userInput) => {
    const admissions = pendingAdmissions.get(to) || {step: 1};

    if(admissions.step === 1){
        if(!isUserVerified(to)){
            await handleUserVerification(to, userInput); 
            pendingAdmissions.set(to, { step: 2});
            return;
        } else {
            console.log("User Already verified, proceeding with patient admission"); 
            await sendMessage(to, "Please enter your full name"); 
            pendingAdmissions.set(to, {step: 2}); 
            return;
        }
    } 

    if(admissions.step === 2){
        admissions.fullname = userInput; 
        await sendMessage(to, "Please enter your gender"); 
        pendingAdmissions.set(to, {...admissions, step: 3});
        return; 
    }

    if(admissions.step === 3){
        admissions.gender = userInput; 
        await sendMessage(to, "Please enter your date of birth"); 
        pendingAdmissions.set(to, {...admissions, step: 4});
        return; 
    } 

    if(admissions.step === 4){
        admissions.dob = userInput; 
        await sendMessage(to, "Please enter your phone number");
        pendingAdmissions.set(to, {...admissions, step: 5}); 
        return;
    } 

    if(admissions.step === 5){ 
        admissions.phoneNumber = userInput; 
        await sendMessage(to, "Please enter your reason for admission"); 
        pendingAdmissions.set(to, {...admissions, step: 6}); 
        return; 
    } 

    if(admissions.step === 6){
        admissions.admissionReason = userInput; 
        await sendAdmissionConfirmation(to, admissions); 
        return;
    }


}


const handleDoctorPatientAdmission = async(to, userInput) => {
    const admissions = pendingAdmissions.get(to) || { step: 1}; 

    if(admissions.step === 1){
        console.log("Doctor patient referral");
        await sendMessage(to, "Please enter your name"); 
        pendingAdmissions.set(to, {step: 2}); 
        return;
    } 

    if(admissions.step === 2){
        admissions.doctorName = userInput; 
        await sendMessage(to, "Please enter your practice number");
        pendingAdmissions.set(to, {...admissions, step: 3}); 
        return;
    } 

    if(admissions.step === 3){ 
        admissions.practiceNumber = userInput; 
        await sendMessage(to, "Please enter the patient's name"); 
        pendingAdmissions.set(to, {...admissions, step: 4}); 
        return; 
    } 

    if(admissions.step === 4){ 
        admissions.fullname = userInput; 
        await sendMessage(to, "Please enter the patient's date of birth");
        pendingAdmissions.set(to, {...admissions, step: 5}); 
        return; 
    } 

    if(admissions.step === 5){ 
        admissions.dob = userInput; 
        await sendMessage(to, "Please enter the patient's gender"); 
        pendingAdmissions.set(to, {...admissions, step: 6}); 
        return;
    } 

    if(admissions.step === 6){
        admissions.gender = userInput; 
        await sendMessage(to, "Please enter the patient's phone number"); 
        pendingAdmissions.set(to, {...admissions, step: 7}); 
        return; 
    } 

    if(admissions.step === 7){
        admissions.phoneNumber = userInput; 
        await sendMessage(to, "Please enter reason for admission"); 
        pendingAdmissions.set(to, {...admissions, step: 8});
        return; 
    } 

    if(admissions.step === 8){
        admissions.admissionReason = userInput; 
        await sendAdmissionConfirmation(to, admissions); 
        return;
    }
}



module.exports = {handleSelfPatientAdmission, handleDoctorPatientAdmission, pendingAdmissions};