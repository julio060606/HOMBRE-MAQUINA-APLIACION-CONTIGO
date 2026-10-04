/// <reference types="vite/client" />

export const ENV = {
  USE_MOCKS: import.meta.env.VITE_USE_MOCKS !== 'false',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
};
