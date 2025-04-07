const fs = require('fs');
const { faker } = require('@faker-js/faker');

// Lists of potential medical conditions
const medicalConditions = [
    "Hypertension", "Diabetes", "Asthma", "Allergies", "Migraines", "Anemia", 
    "Epilepsy", "Heart Disease", "Arthritis", "Depression", "Anxiety", 
    "Thyroid Disorder", "COPD", "Osteoporosis", "Kidney Disease"
];

// Wards in the hospital
const wards = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function generatePatientRecords(numRecords) {
    const patients = [];

    for (let i = 1; i <= numRecords; i++) {
        // Generate unique patient ID
        const patientId = `P${String(i).padStart(3, '0')}`;

        // Generate date of birth (between 25 and 75 years old)
        const dob = faker.date.birthdate({ 
            min: 25, 
            max: 75, 
            mode: 'age' 
        });

        // Generate admission and discharge dates
        const admissionDate = faker.date.between({
            from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
            to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)   // 2 months from now
        });

        const dischargeDateMs = admissionDate.getTime() + 
            faker.number.int({ min: 5 * 24 * 60 * 60 * 1000, max: 120 * 24 * 60 * 60 * 1000 });
        const dischargeDate = new Date(dischargeDateMs);

        // Generate medical history
        const numConditions = faker.number.int({ min: 1, max: 3 });
        const medicalHistory = faker.helpers.uniqueArray(medicalConditions, numConditions);

        const patient = {
            patient_id: patientId,
            first_name: faker.person.firstName(),
            last_name: faker.person.lastName(),
            dob: dob.toISOString().split('T')[0],
            address: faker.location.streetAddress({ useFullAddress: true }),
            phone_number: `+263 ${faker.number.int({ min: 8000, max: 8999})} ${faker.number.int({ min: 100000, max: 999999 })}`,
            email: faker.internet.email(),
            ward: faker.helpers.arrayElement(wards),
            room_number: `${faker.number.int({ min: 1, max: 5 })}${faker.number.int({ min: 0, max: 9 })}${faker.number.int({ min: 0, max: 9 })}`,
            bed_number: `${faker.helpers.arrayElement(wards)}${faker.number.int({ min: 1, max: 9 })}`,
            admission_date: admissionDate.toISOString().split('T')[0],
            discharge_date: dischargeDate.toISOString().split('T')[0],
            medical_history: medicalHistory
        };

        patients.push(patient);
    }

    return patients;
}

// Generate 100 patient records
const patientRecords = generatePatientRecords(100);

// Create the final JSON structure
const output = { patients: patientRecords };

// Write to a JSON file
fs.writeFileSync('patient_records.json', JSON.stringify(output, null, 4));

console.log(`Generated ${patientRecords.length} patient records and saved to patient_records.json`);