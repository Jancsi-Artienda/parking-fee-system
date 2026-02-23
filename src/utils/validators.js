const GMAIL_REGEX = /^[a-z0-9](\.?[a-z0-9]){4,29}@gmail\.com$/i;

export function sanitizeRegistrationField(name, value) {
  if (name === "contactNumber") {
    return value.replace(/\D/g, "").slice(0, 11);
  }

  if (name === "firstName" || name === "lastName") {
    return value.replace(/\d/g, "");
  }

  return value;
}

export function validateRegistrationField(name, value) {
  const trimmedValue = typeof value === "string" ? value.trim() : value;

  if (!trimmedValue) {
    return "This field is required";
  }

  if ((name === "firstName" || name === "lastName") && /\d/.test(trimmedValue)) {
    return "This field cannot contain numbers";
  }

  if (name === "email" && !GMAIL_REGEX.test(trimmedValue)) {
    return "Email must be a valid @gmail.com address";
  }

  if (name === "contactNumber" && !/^\d{11}$/.test(trimmedValue)) {
    return "Contact number must be exactly 11 digits";
  }

  return "";
}

export function validateRegistrationForm(formData) {
  const errors = {};

  Object.keys(formData).forEach((key) => {
    const error = validateRegistrationField(key, formData[key]);
    if (error) {
      errors[key] = error;
    }
  });

  return errors;
}

export function sanitizeAccountField(name, value) {
  if (name === "contactNumber") {
    return value.replace(/\D/g, "").slice(0, 11);
  }

  if (name === "name") {
    return value.replace(/\d/g, "");
  }

  return value;
}

export function validateAccountField(name, value) {
  const trimmedValue = typeof value === "string" ? value.trim() : value;

  if (name === "name") {
    if (!trimmedValue) {
      return "This field is required";
    }

    if (/\d/.test(trimmedValue)) {
      return "This field cannot contain numbers";
    }
  }

  if (name === "email") {
    if (!trimmedValue) {
      return "This field is required";
    }

    if (!GMAIL_REGEX.test(trimmedValue)) {
      return "Email must be a valid @gmail.com address";
    }
  }

  if (name === "contactNumber") {
    if (!trimmedValue) {
      return "This field is required";
    }

    if (!/^\d{11}$/.test(trimmedValue)) {
      return "Contact number must be exactly 11 digits";
    }
  }

  return "";
}

export function validateAccountForm(formData) {
  const fieldsToValidate = ["name", "email", "contactNumber"];
  const errors = {};

  fieldsToValidate.forEach((field) => {
    const error = validateAccountField(field, formData[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;


}

export function validateAddvehicleForm(formData) {
   validateUppercase(data);
  const validateUppercase = (data) => {
    const fieldsToCheck = ["type", "name", "plate", "color"];

    for (let field of fieldsToCheck) {
      if (data[field] && data[field] !== data[field].toUpperCase()) {
        throw new Error(`${field} must be uppercase only.`);
      }
    }
  };
}


export const getPasswordStrength = (password) => {
  return {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasMinLength: password.length >= 8,
  };
};