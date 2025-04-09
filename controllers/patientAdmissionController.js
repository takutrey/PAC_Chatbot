const { sendMessage, sendAdmissionConfirmation } = require("../functions/messageTemplates");
const { isUserVerified } = require("./patientSearchLoggerController");
const { handleUserVerification } = require("./userVerificationController");
const dayjs = require("dayjs");

const pendingAdmissions = new Map();

// Input Validations
const nameValidation = (name) => {
    return name && typeof name === 'string' && name.trim().length >= 2;
};

const genderValidation = (gender) => {
    const validGender = gender.trim().toLowerCase();
    if (validGender === "m") return "male";
    if (validGender === "f") return "female";
    if (validGender === "male" || validGender === "female") return validGender;
    return null;
};

const formatPhoneNumber = (phoneNumber) => phoneNumber.replace(/\D/g, '');

// -------------------------- Self Admission Flow --------------------------

const handleSelfPatientAdmission = async (to, userInput) => {
    const admissions = pendingAdmissions.get(to) || { step: 1 };

    if (admissions.step === 1) {
        if (!isUserVerified(to)) {
            await handleUserVerification(to, userInput);
            pendingAdmissions.set(to, { step: 2 });
            return;
        } else {
            await sendMessage(to, "Please enter your first name");
            pendingAdmissions.set(to, { step: 2 });
            return;
        }
    }

    if (admissions.step === 2) {
        if (!nameValidation(userInput)) {
            await sendMessage(to, "Please enter a valid first name (at least 2 characters)");
            return;
        }
        admissions.firstname = userInput.trim();
        await sendMessage(to, "Please enter your last name");
        pendingAdmissions.set(to, { ...admissions, step: 3 });
        return;
    }

    if (admissions.step === 3) {
        if (!nameValidation(userInput)) {
            await sendMessage(to, "Please enter a valid last name (at least 2 characters)");
            return;
        }
        admissions.lastname = userInput.trim();
        await sendMessage(to, "Please enter your gender");
        pendingAdmissions.set(to, { ...admissions, step: 4 });
        return;
    }

    if (admissions.step === 4) {
        const validatedGender = genderValidation(userInput);
        if (!validatedGender) {
            await sendMessage(to, "Please enter a valid gender. Male or Female");
            return;
        }
        admissions.gender = validatedGender;
        await sendMessage(to, "Please enter your date of birth in DD-MM-YYYY format");
        pendingAdmissions.set(to, { ...admissions, step: 5 });
        return;
    }

    if (admissions.step === 5) {
        const formattedDate = dayjs(userInput, 'DD-MM-YYYY').format('YYYY-MM-DD');
        if (!dayjs(formattedDate).isValid()) {
            await sendMessage(to, "Invalid date format. Please enter date in DD-MM-YYYY format");
            return;
        }
        admissions.dob = formattedDate;
        await sendMessage(to, "Please enter your phone number");
        pendingAdmissions.set(to, { ...admissions, step: 6 });
        return;
    }

    if (admissions.step === 6) {
        admissions.phoneNumber = formatPhoneNumber(userInput);
        await sendMessage(to, "Please enter your email");
        pendingAdmissions.set(to, { ...admissions, step: 7 });
        return;
    }

    if(admissions.step === 7){
        admissions.email = userInput; 
        await sendMessage(to, "Please enter your address"); 
        pendingAdmissions.set(to, {...admissions, step: 8}); 
        return;

    } 

    if(admissions.step === 8){
        admissions.address = userInput; 
        await sendMessage(to, "Please enter your emergency contact number"); 
        pendingAdmissions.set(to, {...admissions, step: 9}); 
        return;
    }

    if (admissions.step === 9) {
        admissions.admissionReason = userInput;
        await sendAdmissionConfirmation(to, admissions);
        return;
    }
};

// -------------------------- Doctor Admission Flow --------------------------

const handleDoctorPatientAdmission = async (to, userInput) => {
    const admissions = pendingAdmissions.get(to) || { step: 1 };

    if (admissions.step === 1) {
        await sendMessage(to, "Please enter your first name");
        pendingAdmissions.set(to, { step: 2 });
        return;
    }

    if (admissions.step === 2) {
        if (!nameValidation(userInput)) {
            await sendMessage(to, "Please enter a valid first name");
            return;
        }
        admissions.doctorFirstname = userInput.trim();
        await sendMessage(to, "Please enter your last name");
        pendingAdmissions.set(to, { ...admissions, step: 3 });
        return;
    }

    if (admissions.step === 3) {
        if (!nameValidation(userInput)) {
            await sendMessage(to, "Please enter a valid last name");
            return;
        }
        admissions.doctorLastname = userInput.trim();
        await sendMessage(to, "Please enter your practice number");
        pendingAdmissions.set(to, { ...admissions, step: 4 });
        return;
    }

    if (admissions.step === 4) {
        admissions.practiceNumber = userInput;
        await sendMessage(to, "Please enter the patient's first name");
        pendingAdmissions.set(to, { ...admissions, step: 5 });
        return;
    }

    if (admissions.step === 5) {
        if (!nameValidation(userInput)) {
            await sendMessage(to, "Please enter a valid first name");
            return;
        }
        admissions.firstname = userInput.trim();
        await sendMessage(to, "Please enter the patient's last name");
        pendingAdmissions.set(to, { ...admissions, step: 6 });
        return;
    }

    if (admissions.step === 6) {
        if (!nameValidation(userInput)) {
            await sendMessage(to, "Please enter a valid last name");
            return;
        }
        admissions.lastname = userInput.trim();
        await sendMessage(to, "Please enter the patient's date of birth (DD-MM-YYYY)");
        pendingAdmissions.set(to, { ...admissions, step: 7 });
        return;
    }

    if (admissions.step === 7) {
        const formattedDate = dayjs(userInput, 'DD-MM-YYYY').format('YYYY-MM-DD');
        if (!dayjs(formattedDate).isValid()) {
            await sendMessage(to, "Invalid date format. Please enter date in DD-MM-YYYY format");
            return;
        }
        admissions.dob = formattedDate;
        await sendMessage(to, "Please enter the patient's gender");
        pendingAdmissions.set(to, { ...admissions, step: 8 });
        return;
    }

    if (admissions.step === 8) {
        const validatedGender = genderValidation(userInput);
        if (!validatedGender) {
            await sendMessage(to, "Please enter a valid gender. Male or Female");
            return;
        }
        admissions.gender = validatedGender;
        await sendMessage(to, "Please enter the patient's phone number");
        pendingAdmissions.set(to, { ...admissions, step: 9 });
        return;
    }

    if (admissions.step === 9) {
        admissions.phoneNumber = formatPhoneNumber(userInput);
        await sendMessage(to, "Please enter reason for admission");
        pendingAdmissions.set(to, { ...admissions, step: 10 });
        return;
    }

    if (admissions.step === 10) {
        admissions.admissionReason = userInput;
        await sendAdmissionConfirmation(to, admissions);
        return;
    }
};

module.exports = {
    handleSelfPatientAdmission,
    handleDoctorPatientAdmission,
    pendingAdmissions
};
