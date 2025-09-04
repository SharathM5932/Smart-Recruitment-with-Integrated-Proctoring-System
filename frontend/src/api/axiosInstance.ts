import axios from "axios";
// For Backend
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_MAIN_APP_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // keep this if you need cookies/sessions
});

export default axiosInstance;
