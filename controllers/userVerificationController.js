const { sendMessage, sendWelcomeMessage } = require('../functions/messageTemplates');
const {verifyUser} = require('./patientSearchLoggerController');


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

    // If they provided text with name and ID
    if (userInput && userInput.trim().split(/\s+/).length >= 3) {
        // Parse the input
        const parts = userInput.trim().split(/\s+/);
        let nationalId = parts[parts.length - 1];
        nationalId = nationalId.replace(/[-\s]/g, '');
        const firstname = parts[0];
        const middlename = parts.length > 3 ? parts.slice(1, parts.length - 2).join('') : '';
        const lastname = parts[parts.length - 2];
        const name = middlename ? `${firstname} ${middlename} ${lastname}` : `${firstname} ${lastname}`;

        // Store this information and ask for ID image
        pendingVerifications.set(to, {
            name: name,
            nationalId: nationalId,
            timestamp: Date.now(),
        });

        verifyUser(to, name);
        await sendMessage(to, "Verification complete. You may proceed");
        await sendWelcomeMessage(to);
        return true;
    }

    // Default case - they haven't provided proper information
    else {
        await sendMessage(to, "Please provide your fullname and National ID number in the format: FirstName LastName xx-xxxx x xx");
        return false;
    }
}; 

module.exports = {handleUserVerification};