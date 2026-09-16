'use client';
const nameRegex = /^[A-Za-z0-9\s.'\-&,/()@#%*!-'"?|{};:]+$/;
const orgNameRegex = /^[A-Za-z0-9\s.'\-&,/()@#%*!-'"?|{};:]+$/;
const phoneRegex = /^[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
const pincodeRegex = /^[A-Za-z0-9\s-]{3,10}$/;

export const nameValidator = (name) => {
  if (!name || name.trim().length === 0) return "Name is required.";
  if (!nameRegex.test(name)) return "Invalid name format.";
  return "";
};

export const descriptionValidator = (text) => {
  const trimmed = text?.trim();
  if (!trimmed || trimmed.length === 0) return "Description is required.";
  if (trimmed.length < 10) return "Description must be at least 10 characters.";
  if (/^\d+$/.test(trimmed)) return "Description cannot be only numbers.";
  return "";
};

export const orgTypeValidation = (orgType) => {
  if (!orgType || orgType.length <= 0) return "Organization type is required.";
  return "";
};

export const orgNameValidation = (orgName) => {
  if (!orgName || orgName.trim().length === 0) return "Organization name is required.";
  if (!orgNameRegex.test(orgName) || orgName.length < 3) return "Invalid organization name.";
  return "";
};

export const phoneValidation = (number) => {
  if (!number || number.trim() === "") return "Phone number is required.";
  if (!phoneRegex.test(number)) return "Please enter a valid 10-digit phone number.";
  return "";
};

export const emailValidator = (email) => {
  if (!email || email.trim() === "") return "Email address is required.";
  if (!emailRegex.test(email)) return "Please enter a valid email address.";
  return "";
};

const personalEmailDomains = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "zoho.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "gmx.com",
  "yandex.com",
  "rediffmail.com",
];

export const officialEmailValidator = (officialEmail) => {
  if (!officialEmail || officialEmail.trim() === "") return "Official work email is required.";
  const trimmed = officialEmail.trim().toLowerCase();
  if (!emailRegex.test(trimmed)) return "Please enter a valid email address.";

  const domain = trimmed.split("@")[1];
  if (personalEmailDomains.includes(domain)) {
    return "Personal email addresses (@gmail, @yahoo, @outlook, etc.) are not allowed. Please enter your official company work email.";
  }
  return "";
};

export const passwordValidator = (password) => {
  if (!password || password.trim() === "") return "Password is required.";
  if (!passwordRegex.test(password))
    return "Password must be at least 6 characters with a letter and a number.";
  return "";
};

export const confirmPasswordValidation = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.trim() === "") return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return "";
};

export const pincodeValidator = (pincode) => {
  if (!pincode || pincode.trim().length === 0) return "Pincode is required.";
  if (!pincodeRegex.test(pincode) || pincode.length < 3) return "Invalid pincode.";
  return "";
};

export const selectValidator = (selectValue) => {
  if (!selectValue) return "Selection is required.";
  return "";
};

export const genderValidator = (genderValue) => {
  if (!genderValue || genderValue.trim().length === 0) return "Gender is required.";
  return "";
};

export const userTypeValidator = (userTypeValue) => {
  if (!userTypeValue || userTypeValue.length <= 0) return "User type is required.";
  return "";
};
