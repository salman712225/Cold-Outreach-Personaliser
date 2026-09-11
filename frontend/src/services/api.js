const API_BASE = "http://localhost:8000";

const getHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      return await res.json();
    } catch {
      return { status: "offline", database: "disconnected" };
    }
  },

  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("auth_token", data.access_token);
    }
    return data;
  },

  register: async (email, password, full_name) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("auth_token", data.access_token);
    }
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getHeaders()
    });
    return res.ok ? await res.json() : null;
  },

  // Single Outreach
  generateOutreach: async (payload) => {
    const res = await fetch(`${API_BASE}/api/outreach/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Outreach generation failed");
    }
    return await res.json();
  },

  // Batch CSV
  uploadBatchCSV: async (formData) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_BASE}/api/batch/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to upload batch CSV");
    }
    return await res.json();
  },

  getBatchStatus: async (jobId) => {
    const res = await fetch(`${API_BASE}/api/batch/status/${jobId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to get batch status");
    return await res.json();
  },

  getDownloadCSVUrl: (jobId) => `${API_BASE}/api/batch/download/${jobId}`,
  getSampleTemplateUrl: () => `${API_BASE}/api/batch/sample-template`,

  // RAG Knowledge Base
  listKnowledgeDocs: async () => {
    const res = await fetch(`${API_BASE}/api/rag/docs`, {
      headers: getHeaders()
    });
    return res.ok ? await res.json() : [];
  },

  addKnowledgeDoc: async (doc) => {
    const res = await fetch(`${API_BASE}/api/rag/docs`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(doc)
    });
    if (!res.ok) throw new Error("Failed to add knowledge document");
    return await res.json();
  },

  deleteKnowledgeDoc: async (docId) => {
    const res = await fetch(`${API_BASE}/api/rag/docs/${docId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.ok;
  },

  // Evaluation & LangSmith
  runEvaluationSuite: async () => {
    const res = await fetch(`${API_BASE}/api/evaluation/run-suite`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Evaluation suite run failed");
    return await res.json();
  },

  getEvalStatus: async () => {
    const res = await fetch(`${API_BASE}/api/evaluation/status`);
    return res.ok ? await res.json() : null;
  },

  // History
  getHistory: async () => {
    const res = await fetch(`${API_BASE}/api/history/list`, {
      headers: getHeaders()
    });
    return res.ok ? await res.json() : [];
  },

  deleteHistoryItem: async (id) => {
    const res = await fetch(`${API_BASE}/api/history/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.ok;
  },

  getBatchHistory: async () => {
    const res = await fetch(`${API_BASE}/api/history/batches`, {
      headers: getHeaders()
    });
    return res.ok ? await res.json() : [];
  }
};
