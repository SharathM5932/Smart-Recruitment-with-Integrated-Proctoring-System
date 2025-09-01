import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000", // change when moving to prod
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
