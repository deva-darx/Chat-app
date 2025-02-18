import axios from "axios";

// Configure Axios for API calls
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Include cookies for authentication
});

// Interceptor for handling errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

// Authentication APIs
export const signup = (userData) => API.post("/auth/signup", userData);
export const login = (userData) => API.post("/auth/login", userData);
export const logout = () => API.post("/auth/logout");
export const checkAuth = () => API.get("/auth/check");
export const getCurrentUser = () => API.get("/auth/user"); // Fetch logged-in user's details
export const getUserById = (userId) => API.get(`/users/${userId}`);


// Messaging APIs
export const getUsers = () => API.get("/messages/users");
export const getMessages = (userId) => API.get(`/messages/${userId}`);
export const sendMessage = (userId, message) =>
  API.post(`/messages/${userId}`, { text: message });

export default API;
