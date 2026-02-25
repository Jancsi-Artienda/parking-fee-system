const GMAIL_REGEX = /^[a-z0-9](\.?[a-z0-9]){4,29}@gmail\.com$/i;

export function sanitizeRegistrationField(name, value) {
  if (name === "contactNumber") {
    return value.replace(/\D/g, "").slice(0, 11);
  }

  if (name === "vehicleNumber") {
    return value.replace(/\D/g, "").slice(0, 2);
  }

  if (name === "firstName" || name === "lastName") {
    return value.replace(/\d/g, "");
  }

  return value;
}

export function validateRegistrationField(name, value) {
  const trimmedValue = typeof value === "string" ? value.trim() : value;

  if (name === "firstName" || name === "lastName") {
    if (!trimmedValue) return "This field is required";
    if (/\d/.test(trimmedValue)) return "This field cannot contain numbers";
    return "";
  }

  if (name === "email") {
    if (!trimmedValue) return "This field is required";
    if (!GMAIL_REGEX.test(trimmedValue)) return "Email must be a valid @gmail.com address";
    return "";
  }

  if (name === "contactNumber") {
    if (!trimmedValue) return "This field is required";
    if (!/^\d{11}$/.test(trimmedValue)) return "Contact number must be exactly 11 digits";
    return "";
  }

  if (name === "username") {
    if (!trimmedValue) return "This field is required";
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedValue)) {
      return "Username must be 3-20 characters using letters, numbers, or underscore";
    }
    return "";
  }

  if (name === "password") {
    if (!trimmedValue) return "This field is required";
    const strength = getPasswordStrength(trimmedValue);
    if (!strength.hasUppercase || !strength.hasLowercase || !strength.hasNumber || !strength.hasMinLength) {
      return "Password must include uppercase, lowercase, number, and at least 8 characters";
    }
    return "";
  }

  if (name === "confirmPassword") {
    if (!trimmedValue) return "This field is required";
    return "";
  }

  if (name === "vehicleNumber") {
    if (!trimmedValue) return "This field is required";
    if (!/^\d+$/.test(trimmedValue) || Number(trimmedValue) < 1) {
      return "Number of vehicles must be at least 1";
    }
    return "";
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

  if (
    !errors.password &&
    !errors.confirmPassword &&
    formData.password !== formData.confirmPassword
  ) {
    errors.confirmPassword = "Passwords do not match";
  }

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

  if (name === "username") {
    if (!trimmedValue) {
      return "This field is required";
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedValue)) {
      return "Username must be 3-20 characters using letters, numbers, or underscore";
    }
  }

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
  const fieldsToValidate = ["username", "name", "email", "contactNumber"];
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
  const fieldsToCheck = ["type", "name", "plate", "color"];

  for (const field of fieldsToCheck) {
    if (formData[field] && formData[field] !== formData[field].toUpperCase()) {
      return `${field} must be uppercase only.`;
    }
  }

  return "";
}


export const getPasswordStrength = (password) => {
  return {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasMinLength: password.length >= 8,
  };
};
