import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "antigravity-secret-key";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
  },
});

export const fetcher = (url: string) => api.get(url).then((res) => res.data);
