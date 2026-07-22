import toast from 'react-hot-toast';

const API_BASE = '/api';

export const getAuthHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem('eduvista_token');
  return {
    'Content-Type': 'application/json',
    ...extraHeaders,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const fetchApi = async (endpoint, options = {}) => {
  const headers = getAuthHeaders(options.headers);
  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    let data = null;
    try {
        data = await response.json();
    } catch(e) { /* ignore JSON parse error */ }

    if (!response.ok) {
      const errorMsg = data?.error || response.statusText || "An unexpected error occurred.";
      
      // Auto logout on 401
      if (response.status === 401) {
        localStorage.removeItem('eduvista_token');
        localStorage.removeItem('eduvista_user');
        window.location.href = '/'; // Simple redirect for now
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(errorMsg);
      }
      
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    if (error.message !== "Session expired. Please log in again.") {
       toast.error(error.message || "Network Error");
    }
    throw error;
  }
};
