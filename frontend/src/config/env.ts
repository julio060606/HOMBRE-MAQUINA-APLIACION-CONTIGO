/// <reference types="vite/client" />

export const ENV = {
  USE_MOCKS: import.meta.env.VITE_USE_MOCKS === 'true',
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, ''),
};
