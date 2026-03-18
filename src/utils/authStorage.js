const USER_STORAGE_KEY = "user";

function parseStoredUser(rawUser) {
  if (!rawUser) {
    return null;
  }

  return JSON.parse(rawUser);
}

export function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
}

function sanitizeUserForStorage(userData) {
  if (!userData || typeof userData !== "object") {
    return null;
  }

  const { token: _ignoredToken, ...safeUser } = userData;
  return safeUser;
}

export function readStoredUser() {
  try {
    const localUser = parseStoredUser(localStorage.getItem(USER_STORAGE_KEY));
    if (localUser) {
      return localUser;
    }

    const sessionUser = parseStoredUser(sessionStorage.getItem(USER_STORAGE_KEY));
    if (sessionUser) {
      return sessionUser;
    }
  } catch {
    clearStoredUser();
  }

  return null;
}

export function storeUser(userData, rememberMe = false) {
  clearStoredUser();
  const safeUser = sanitizeUserForStorage(userData);
  if (!safeUser) {
    return;
  }

  if (rememberMe) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
    return;
  }

  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
}

export function getUserStorageType() {
  if (localStorage.getItem(USER_STORAGE_KEY)) {
    return "local";
  }

  if (sessionStorage.getItem(USER_STORAGE_KEY)) {
    return "session";
  }

  return null;
}

export function updateStoredUser(userData) {
  const safeUser = sanitizeUserForStorage(userData);
  if (!safeUser) {
    clearStoredUser();
    return;
  }

  const storageType = getUserStorageType();

  if (storageType === "session") {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
    return;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
}
