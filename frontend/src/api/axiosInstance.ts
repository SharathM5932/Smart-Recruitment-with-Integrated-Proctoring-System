import axios from "axios";
// For Backend
const axiosInstance = axios.create({
  baseURL: "http://localhost:3000", // change when moving to prod
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // keep this if you need cookies/sessions
});

export default axiosInstance;
