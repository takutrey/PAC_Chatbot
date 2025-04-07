const searchLogs = {};
const verifiedUsers = {};

// Log a patient search (no saving data to file)
const logSearch = (phoneNumber, patientName) => {
    const todayDate = new Date().toISOString().split('T')[0];

    if (!searchLogs[phoneNumber] || searchLogs[phoneNumber].date !== todayDate) {
        searchLogs[phoneNumber] = { date: todayDate, count: 0, patients: new Set() };
    }

    if (searchLogs[phoneNumber].count >= 5) {
        return false;
    }

    searchLogs[phoneNumber].count += 1;
    searchLogs[phoneNumber].patients.add(patientName);
    console.log(`${phoneNumber} searched for ${patientName} (${searchLogs[phoneNumber].count})`);

    return true; // Return true without saving data
};

// Verify a user (no saving data to file)
const verifyUser = (phoneNumber, verifiedName) => {
    verifiedUsers[phoneNumber] = { name: verifiedName, verified: true };
    console.log(`User ${verifiedName} verified with phone number ${phoneNumber}`);
};

// Check if user is verified
const isUserVerified = (phoneNumber) => {
    return verifiedUsers[phoneNumber]?.verified || false;
};

// Get verified user's name
const getVerifiedName = (phoneNumber) => {
    return verifiedUsers[phoneNumber]?.name || null;
};

// Get user's search count
const getUserSearchCount = (phoneNumber) => {
    const todayDate = new Date().toISOString().split('T')[0];
    return searchLogs[phoneNumber]?.date === todayDate ? searchLogs[phoneNumber].count : 0;
};

module.exports = {
    logSearch,
    getUserSearchCount,
    verifyUser,
    getVerifiedName,
    isUserVerified
};
