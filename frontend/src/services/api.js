import axios from "axios";

// Create Axios instance
const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  // REMOVED hardcoded Content-Type header to allow Axios 
  // to dynamically handle JSON vs FormData seamlessly.
});

// Attach JWT to every request automatically
API.interceptors.request.use(
  (config) => {
    // Verified: using 'access_token' matching standard JWT setups
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;