import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHttpService, ApiError } from './httpService';
import { setAuthToken, clearTokens, getAuthToken } from './tokenStorage';
import { ENV } from '../../config/env';

describe('tokenStorage', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('stores, retrieves and clears access and refresh tokens', () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken('access-token-123');
    expect(getAuthToken()).toBe('access-token-123');
    clearTokens();
    expect(getAuthToken()).toBeNull();
  });
});

describe('httpService (Strict API Mode without Silent Mocks)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearTokens();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('attaches Bearer token in headers when user is authenticated', async () => {
    setAuthToken('jwt-sample-token');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 'pat-1', fullName: 'Dacio Hurtado' }],
    });
    global.fetch = mockFetch;

    const service = createHttpService();
    const patients = await service.patients();

    expect(patients).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${ENV.API_BASE_URL}/patients`);
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer jwt-sample-token');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('throws ApiError with server message on HTTP 403 / 404 without silent fallback', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Acceso no autorizado al paciente pat-999' }),
    });
    global.fetch = mockFetch;

    const service = createHttpService();
    await expect(service.view('pat-999')).rejects.toThrow(ApiError);
    await expect(service.view('pat-999')).rejects.toThrow('Acceso no autorizado al paciente pat-999');
  });

  it('throws ApiError on network disconnect instead of silently serving mock data', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    global.fetch = mockFetch;

    const service = createHttpService();
    await expect(service.patients()).rejects.toThrow(ApiError);
    await expect(service.patients()).rejects.toThrow(/No se pudo conectar al servidor backend/);
  });

  it('routes standard intake responses to dose responses endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'intake-1', status: 'TAKEN' }),
    });
    global.fetch = mockFetch;

    const service = createHttpService();
    await service.respond({
      patientId: 'pat-1',
      doseId: 'dose-100',
      response: 'TAKEN',
      operationId: 'op-123',
      expectedVersion: 1,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${ENV.API_BASE_URL}/patients/pat-1/doses/dose-100/responses`);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.response).toBe('TAKEN');
    expect(body.operationId).toBe('op-123');
    expect(body.expectedDoseVersion).toBe(1);
  });

  it('routes intake corrections to the dedicated corrections endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'intake-1', status: 'NOT_TAKEN' }),
    });
    global.fetch = mockFetch;

    const service = createHttpService();
    await service.respond({
      patientId: 'pat-1',
      doseId: 'intake-1',
      response: 'NOT_TAKEN',
      operationId: 'op-corr-1',
      expectedVersion: 1,
      reason: 'Error al pulsar',
      correction: true,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${ENV.API_BASE_URL}/patients/pat-1/intakes/intake-1/corrections`);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.newStatus).toBe('NOT_TAKEN');
    expect(body.reason).toBe('Error al pulsar');
  });

  it('routes inventory movements to supplies endpoint with operationId', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    global.fetch = mockFetch;

    const service = createHttpService();
    await service.moveSupply('pat-1', 'med-1', {
      kind: 'RESTOCK',
      quantity: 30,
      reason: 'Compra en botica',
    }, 'op-stock-1');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${ENV.API_BASE_URL}/patients/pat-1/supplies/med-1/movements`);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.kind).toBe('RESTOCK');
    expect(body.quantity).toBe(30);
    expect(body.reason).toBe('Compra en botica');
    expect(body.operationId).toBe('op-stock-1');
  });
});
