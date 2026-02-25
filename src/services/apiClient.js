const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  const response = await fetch(url, config);

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const backendMessage =
      data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : "API request failed";
    const error = new Error(backendMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return { data };
}

const apiClient = {
  get(path, options) {
    return request(path, { ...options, method: "GET" });
  },
  post(path, body, options) {
    return request(path, { ...options, method: "POST", body });
  },
  put(path, body, options) {
    return request(path, { ...options, method: "PUT", body });
  },
  patch(path, body, options) {
    return request(path, { ...options, method: "PATCH", body });
  },
  delete(path, options) {
    return request(path, { ...options, method: "DELETE" });
  },
};

export default apiClient;
