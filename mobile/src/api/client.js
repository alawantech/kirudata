import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE = "https://kirudata.com/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request from SecureStore
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
export { API_BASE };
