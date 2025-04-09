const { sendMessage, sendWelcomeMessage } = require('../functions/messageTemplates');
const { verifyUser } = require('./patientSearchLoggerController');

const pendingVerifications = new Map();

const handleUserVerification = async (to, userInput) => {
    const VerificationTimeout = 1000 * 60 * 5; // 5 minutes
    const interval = 1000 * 60; // 1 minute
    
    setInterval(() => {
        const now = Date.now();
        for(const [phoneNumber, data] of pendingVerifications.entries()){
            if(now - data.timestamp > VerificationTimeout){
                pendingVerifications.delete(phoneNumber);
                console.log(`Verification for ${phoneNumber} timed out`);
            }
        }
    }, interval);

    // Check if we're already in the verification process for this user
    const verificationData = pendingVerifications.get(to);

    if (!verificationData) {
        // First step: ask for full name
        pendingVerifications.set(to, {
            step: 'awaiting_name',
            timestamp: Date.now()
        });
        await sendMessage(to, "Please provide your full name (First Name and Last Name)");
        return false;
    }

    if (verificationData.step === 'awaiting_name') {
        // Validate name (letters, spaces, apostrophes, hyphens)
        const namePattern = /^[A-Za-zÀ-ÿ]+(?:[-' ]?[A-Za-zÀ-ÿ]+)*$/;
        
        if (!namePattern.test(userInput.trim())) {
            await sendMessage(to, "Invalid name format. Please provide your full name using only letters, spaces, apostrophes, or hyphens");
            return false;
        }

        // Store name and ask for ID
        verificationData.name = userInput.trim();
        verificationData.step = 'awaiting_id';
        verificationData.timestamp = Date.now();
        
        await sendMessage(to, "Thank you. Now please provide your National ID number in the format: xx-xxxxxx x xx");
        return false;
    }

    if (verificationData.step === 'awaiting_id') {
        // Validate ID format
        const idPattern = /^\d{2}-\d{6,7} [A-Za-z] \d{2}$/;
        
        if (!idPattern.test(userInput.trim())) {
            await sendMessage(to, "Invalid ID format. Please provide your National ID in the correct format: xx-xxxxxx x xx");
            return false;
        }

        // Store ID and complete verification
        verificationData.nationalId = userInput.trim();
        verificationData.step = 'complete';
        verificationData.timestamp = Date.now();

        verifyUser(to, verificationData.name);
        await sendMessage(to, "Verification complete. You may proceed");
        await sendWelcomeMessage(to);
        
        // Remove from pending verifications
        pendingVerifications.delete(to);
        return true;
    }

    // Default case
    await sendMessage(to, "Please provide the requested information to continue with verification");
    return false;
};

module.exports = { handleUserVerification };