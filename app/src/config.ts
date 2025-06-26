// src/config.ts
// Centralized configuration for environment-specific variables
// Usage: import { API_BASE_URL, IS_PRODUCTION, isLocal } from './config'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const IS_PRODUCTION = import.meta.env.MODE === 'production';

export function isLocal() {
  return import.meta.env.MODE === 'development';
}
