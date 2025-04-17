require("dotenv").config();
const {
  sendMessage,
  sendSelectTimeMessage,
  sendAppointmentConfirmation,
  sendUserDetailsConfirmation,
} = require("../functions/messageTemplates");
const axios = require("axios");
const dayjs = require("dayjs");
const BASE_URL = process.env.BASE_URL;

const pendingAppointments = new Map();

const handleAppointmentBooking = async (to, userInput) => {
  let appointments = pendingAppointments.get(to) || { step: 1 };

  const nameValidation = (name) =>
    name && typeof name === "string" && name.trim().length >= 2;

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const formatPhoneNumber = (phone) => {
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.substring(1);
    return digits.startsWith("263") ? `+${digits}` : `263${digits}`;
  };

  const genderValidation = (gender) => {
    const validGender = gender.trim().toLowerCase();
    if (validGender === "m") return "male";
    if (validGender === "f") return "female";
    if (validGender === "male" || validGender === "female") return validGender;
    return null;
  };

  if (appointments.step === 1) {
    await sendMessage(to, "Please enter your phone number.");
    pendingAppointments.set(to, { step: 2 });
    return;
  }

  if (appointments.step === 2) {
    appointments.phoneNumber = formatPhoneNumber(userInput);

    try {
      const response = await axios.get(
        `${BASE_URL}/api/appointments/patient/${appointments.phoneNumber}`
      );

      if (
        response.data &&
        response.data.phoneNumber === appointments.phoneNumber
      ) {
        pendingAppointments.set(to, {
          ...appointments,
          step: "waiting_for_user_confirmation",
          foundUser: response.data,
        });
        await sendUserDetailsConfirmation(to, response.data);
        return;
      } else {
        await sendMessage(to, "Please enter your first name");
        pendingAppointments.set(to, { ...appointments, step: 3 });
        return;
      }
    } catch (error) {
      console.log("Error fetching details", error);
      await sendMessage(to, "Please enter your first name");
      pendingAppointments.set(to, { ...appointments, step: 3 });
      return;
    }
  }

  if (appointments.step === "waiting_for_user_confirmation") {
    const input = userInput.toLowerCase();
    if (input.includes("confirm")) {
      const found = appointments.foundUser;
      pendingAppointments.set(to, {
        ...appointments,
        firstName: found.firstName,
        lastName: found.lastName,
        idNumber: found.idNumber,
        phoneNumber: found.phoneNumber,
        step: 9,
      });
      await sendMessage(to, "Please enter appointment date (DD-MM-YYYY).");
      return;
    } else if (input.includes("cancel")) {
      await sendMessage(to, "Please enter your first name");
      pendingAppointments.set(to, { ...appointments, step: 3 });
      return;
    } else {
      await sendMessage(to, "Please reply with 'Confirm' or 'Cancel'.");
      return;
    }
  }

  if (appointments.step === 3) {
    if (!nameValidation(userInput)) {
      await sendMessage(to, "Please enter a valid first name (min 2 characters)");
      return;
    }
    appointments.firstName = userInput.trim();
    await sendMessage(to, "Please enter your last name.");
    pendingAppointments.set(to, { ...appointments, step: 4 });
    return;
  }

  if (appointments.step === 4) {
    if (!nameValidation(userInput)) {
      await sendMessage(to, "Please enter a valid last name (min 2 characters)");
      return;
    }
    appointments.lastName = userInput.trim();
    await sendMessage(to, "Please enter your gender (Male/Female).");
    pendingAppointments.set(to, { ...appointments, step: 5 });
    return;
  }

  if (appointments.step === 5) {
    const validatedGender = genderValidation(userInput);
    if (!validatedGender) {
      await sendMessage(to, "Please enter a valid gender. (Male/Female)");
      return;
    }
    appointments.gender = validatedGender;
    await sendMessage(to, "Please enter your date of birth (DD-MM-YYYY).");
    pendingAppointments.set(to, { ...appointments, step: 6 });
    return;
  }

  if (appointments.step === 6) {
    const isValidDate = dayjs(userInput, "DD-MM-YYYY", true).isValid();
    if (!isValidDate) {
      await sendMessage(
        to,
        "Invalid date format. Please enter date in DD-MM-YYYY format"
      );
      return;
    }
    appointments.dateOfBirth = dayjs(userInput, "DD-MM-YYYY").format(
      "YYYY-MM-DD"
    );
    await sendMessage(to, "Please enter your email address.");
    pendingAppointments.set(to, { ...appointments, step: 7 });
    return;
  }

  if (appointments.step === 7) {
    if (!isValidEmail(userInput)) {
      await sendMessage(to, "Please enter a valid email address.");
      return;
    }
    appointments.email = userInput.trim();
    await sendMessage(to, "Please enter your home address.");
    pendingAppointments.set(to, { ...appointments, step: 8 });
    return;
  }

  if (appointments.step === 8) {
    appointments.address = userInput.trim();
    await sendMessage(to, "Please enter your emergency contact number.");
    pendingAppointments.set(to, { ...appointments, step: 9 });
    return;
  }

  if (appointments.step === 9) {
    try {
      appointments.emergencyContact = formatPhoneNumber(userInput);

      const patientDetails = {
        firstName: appointments.firstName,
        lastName: appointments.lastName,
        gender: appointments.gender,
        dateOfBirth: appointments.dateOfBirth,
        phoneNumber: appointments.phoneNumber,
        email: appointments.email,
        address: appointments.address,
        emergencyContact: appointments.emergencyContact,
      };

      await axios.post(
        `${BASE_URL}/api/appointments/register-patient`,
        patientDetails
      );
      await sendMessage(to, "Please enter appointment date (DD-MM-YYYY).");
      pendingAppointments.set(to, { ...appointments, step: 10 });
      return;
    } catch (error) {
      console.error(
        "Error registering user",
        error.response?.data || error.message
      );
      await sendMessage(
        to,
        "There was a problem registering your details. Please try again."
      );
      return;
    }
  }

  if (appointments.step === 10) {
    const isValidDate = dayjs(userInput, "DD-MM-YYYY", true).isValid();
    if (!isValidDate) {
      await sendMessage(
        to,
        "Invalid date format. Please enter date in DD-MM-YYYY format"
      );
      return;
    }
    appointments.date = dayjs(userInput, "DD-MM-YYYY").format("YYYY-MM-DD");
    await sendSelectTimeMessage(to);
    pendingAppointments.set(to, { ...appointments, step: 11 });
    return;
  }

  if (appointments.step === 11) {
    appointments.time = userInput;
    await sendAppointmentConfirmation(to, appointments);
    const appoinmentData = {
        bookingDate: appointments.date, 
        bookingTime: appointments.time
    }; 

    try {
        const response = await axios.post(`${BASE_URL}/api/appointments/appointment`, appoinmentData); 
        console.log(response.data);
        pendingAppointments.delete(to);
        return;
        
    } catch (error) {
        console.error("Error saving appointment details", error.response?.data || error.message);
        await sendMessage(to, "Something went wrong while booking your appointment. Please try again"); 
        return;
        
    }

    
  }
};

module.exports = { handleAppointmentBooking, pendingAppointments };
