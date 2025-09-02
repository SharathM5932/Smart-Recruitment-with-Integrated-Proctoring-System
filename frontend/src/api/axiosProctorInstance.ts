import axios from "axios";

const axiosProctorInstance = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // keep this if you need cookies/sessions
});

export default axiosProctorInstance;
