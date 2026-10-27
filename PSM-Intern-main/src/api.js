const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

function getHeaders(isMultipart = false) {
  const headers = {};
  const token = localStorage.getItem("psm_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(options.isMultipart),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "An error occurred");
  }

  return data;
}

export const PublicAPI = {
  interns: (q) => request(`/interns${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  intern: (id) => request(`/interns/${id}`),
  internDetail: (id) => request(`/interns/${id}`),
  project: (internId) => request(`/projects/intern/${internId}`),
  evaluation: (internId) => request(`/evaluations/intern/${internId}`),
  certificate: (certId) => request(`/certificates/${certId}`),
  verify: (certId) => request(`/verify?id=${encodeURIComponent(certId)}`),
  contact: () => request("/contact"),
  idCard: (internId) => request(`/interns/${internId}/id-card`),
};

export const AuthAPI = {
  login: (emailOrCreds, password) => {
    let body;
    if (typeof emailOrCreds === "object") {
      body = emailOrCreds;
    } else {
      body = { email: emailOrCreds, password };
    }
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  me: () => request("/auth/me"),
  changePassword: (data) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const AdminAPI = {
  dashboard: () => request("/admin/dashboard"),
  profile: () => request("/admin/profile"),
  updateProfile: (payload) =>
    request("/admin/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateContact: (payload) =>
    request("/contact", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  interns: (q) => request(`/interns${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  mentors: () => request("/admin/mentors"),
  saveIntern: (formData, editingId) => {
    const url = editingId ? `/interns/${editingId}` : "/interns";
    return request(url, {
      method: editingId ? "PUT" : "POST",
      body: formData,
      isMultipart: true,
    });
  },
  deactivateIntern: (id) =>
    request(`/interns/${id}`, {
      method: "DELETE",
    }),
  projects: () => request("/projects"),
  saveProject: (payload) =>
    request("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  evaluations: () => request("/evaluations"),
  saveEvaluation: (payload) =>
    request("/evaluations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  publishEvaluation: (id) =>
    request(`/evaluations/${id}/publish`, {
      method: "POST",
    }),
  certificates: () => request("/certificates"),
  generateCertificate: (payload) =>
    request("/certificates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  issueCertificate: (id) =>
    request(`/certificates/${id}/issue`, {
      method: "POST",
    }),
  revokeCertificate: (id, reason) =>
    request(`/certificates/${id}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};
