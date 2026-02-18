const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;

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
