import { InternalServerErrorException, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { FirebaseService } from '../firebase/firebase.service';
import type { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';

jest.mock('../firebase/firebase.service', () => ({
  FirebaseService: class FirebaseService {},
}));

describe('AuthService', () => {
  const config = {
    get: jest.fn().mockReturnValue('https://zenoreatelier.com'),
  };
  const firebase = {
    generatePasswordResetLink: jest.fn<Promise<string>, [string, string]>(),
  };
  const mail = {
    sendPasswordReset: jest.fn<Promise<void>, [string, string]>(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      config as unknown as ConfigService,
      firebase as unknown as FirebaseService,
      mail as unknown as MailService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses a same-origin continue URL and sends only its relative path', async () => {
    firebase.generatePasswordResetLink.mockResolvedValue(
      'https://firebase.example/action?oobCode=reset-code',
    );

    await service.requestPasswordReset(
      ' USER@example.com ',
      'https://zenoreatelier.com/giris?redirect=%2Fodeme',
    );

    expect(firebase.generatePasswordResetLink).toHaveBeenCalledWith(
      'user@example.com',
      'https://zenoreatelier.com/giris?redirect=%2Fodeme',
    );
    const resetUrl = new URL(mail.sendPasswordReset.mock.calls[0][1]);
    expect(resetUrl.origin).toBe('https://zenoreatelier.com');
    expect(resetUrl.pathname).toBe('/auth/action');
    expect(resetUrl.searchParams.get('continueUrl')).toBe(
      '/giris?redirect=%2Fodeme',
    );
  });

  it('replaces an external continue URL with the login URL', async () => {
    firebase.generatePasswordResetLink.mockResolvedValue(
      'https://firebase.example/action?oobCode=reset-code',
    );

    await service.requestPasswordReset(
      'user@example.com',
      'https://attacker.example/phishing',
    );

    expect(firebase.generatePasswordResetLink).toHaveBeenCalledWith(
      'user@example.com',
      'https://zenoreatelier.com/giris',
    );
    const resetUrl = new URL(mail.sendPasswordReset.mock.calls[0][1]);
    expect(resetUrl.searchParams.get('continueUrl')).toBe('/giris');
  });

  it('does not log or rethrow credential-bearing provider errors', async () => {
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const providerError = Object.assign(new Error('request failed'), {
      code: 'auth/internal-error',
      config: {
        headers: { Authorization: 'Bearer secret-access-token' },
      },
    });
    firebase.generatePasswordResetLink.mockRejectedValue(providerError);

    await expect(
      service.requestPasswordReset('user@example.com'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(logger).toHaveBeenCalledWith(
      'Failed to send password reset email (auth/internal-error)',
    );
    expect(JSON.stringify(logger.mock.calls)).not.toContain(
      'secret-access-token',
    );
  });

  it('does not reveal whether a Firebase user exists', async () => {
    firebase.generatePasswordResetLink.mockRejectedValue({
      code: 'auth/user-not-found',
    });

    await expect(
      service.requestPasswordReset('missing@example.com'),
    ).resolves.toEqual({ success: true });
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });
});
