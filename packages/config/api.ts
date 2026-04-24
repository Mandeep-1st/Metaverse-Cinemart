import axios from "axios";
import { getApiBaseUrl } from "./config";

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});
