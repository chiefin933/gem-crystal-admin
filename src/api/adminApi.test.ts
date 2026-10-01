import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_BASE,
  ApiRequestError,
  confirmMfaSetup,
  getAuthHeader,
  loginAdmin,
  logoutAdmin,
  registerC2BCallbackUrls,
  setAuthToken,
  startMfaSetup,
} from './adminApi';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('admin API authentication', () => {
  beforeEach(() => {
    setAuthToken(null);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the owner token in module memory and sends it on logout', async () => {
    setAuthToken('owner-token');
    expect(getAuthHeader()).toEqual({ Authorization: 'Bearer owner-token' });
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true }));

    await logoutAdmin();

    expect(fetch).toHaveBeenCalledWith(API_BASE + '/admin/logout', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer owner-token' }),
    }));
  });

  it('registers C2B callback URLs through the authenticated backend', async () => {
    setAuthToken('owner-token');
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      success: true,
      result: { ResponseCode: '0', ResponseDescription: 'Success' },
    }));

    await registerC2BCallbackUrls();

    expect(fetch).toHaveBeenCalledWith(API_BASE + '/orders/mpesa-c2b-register', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer owner-token' }),
    }));
  });

  it('sends MFA codes only when supplied', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      token: 'token',
      admin: { id: '1', email: 'owner@example.com', name: 'Owner', role: 'OWNER', mfaEnabled: true },
    }));

    await loginAdmin('owner@example.com', 'secret-password', '123456');
    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(request?.body))).toEqual({
      email: 'owner@example.com',
      password: 'secret-password',
      mfaCode: '123456',
    });
  });

  it('preserves structured MFA setup errors for the auth flow', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      success: false,
      error: {
        code: 'MFA_SETUP_REQUIRED',
        message: 'Set up MFA',
        setupToken: 'short-lived-setup-token',
      },
    }, 428));

    const error = await loginAdmin('owner@example.com', 'secret-password').catch(value => value);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 428,
      code: 'MFA_SETUP_REQUIRED',
      details: { setupToken: 'short-lived-setup-token' },
    });
  });

  it('uses the restricted setup token instead of a normal owner token', async () => {
    setAuthToken('normal-owner-token');
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ success: true, secret: 'ABC', otpauthUri: 'otpauth://totp/test', message: 'ok' }))
      .mockResolvedValueOnce(jsonResponse({
        token: 'new-owner-token',
        admin: { id: '1', email: 'owner@example.com', name: 'Owner', role: 'OWNER', mfaEnabled: true },
        recoveryCodes: ['AAAA-BBBB'],
      }));

    await startMfaSetup('setup-token');
    await confirmMfaSetup('setup-token', '123456');

    for (const [, request] of vi.mocked(fetch).mock.calls) {
      expect(request?.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer setup-token' }));
    }
  });
});
