import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly firebase: FirebaseService,
    private readonly mail: MailService,
  ) {}

  async requestPasswordReset(email: string, requestedContinueUrl?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const siteUrl =
      this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
    const continueUrl = this.getSafeContinueUrl(siteUrl, requestedContinueUrl);

    try {
      const firebaseLink = await this.firebase.generatePasswordResetLink(
        normalizedEmail,
        continueUrl,
      );
      const oobCode = new URL(firebaseLink).searchParams.get('oobCode');

      if (!oobCode) {
        this.logger.warn(
          'Firebase password reset link did not include oobCode',
        );
        return { success: true };
      }

      const resetUrl = new URL('/auth/action', siteUrl);
      resetUrl.searchParams.set('mode', 'resetPassword');
      resetUrl.searchParams.set('oobCode', oobCode);
      resetUrl.searchParams.set(
        'continueUrl',
        this.getRelativeUrl(continueUrl),
      );
      resetUrl.searchParams.set('lang', 'tr');

      await this.mail.sendPasswordReset(normalizedEmail, resetUrl.toString());
    } catch (error) {
      if (isFirebaseUserNotFound(error)) {
        return { success: true };
      }

      const errorCode = getErrorCode(error);
      this.logger.error(
        `Failed to send password reset email${errorCode ? ` (${errorCode})` : ''}`,
      );
      throw new InternalServerErrorException(
        'Password reset email could not be sent',
      );
    }

    return { success: true };
  }

  private getSafeContinueUrl(siteUrl: string, requestedContinueUrl?: string) {
    const fallback = new URL('/giris', siteUrl).toString();
    if (!requestedContinueUrl) return fallback;

    try {
      const parsed = new URL(requestedContinueUrl);
      if (parsed.origin !== new URL(siteUrl).origin) return fallback;
      return parsed.toString();
    } catch {
      return fallback;
    }
  }

  private getRelativeUrl(value: string) {
    const parsed = new URL(value);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }
}

function isFirebaseUserNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'auth/user-not-found'
  );
}

function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    /^[a-z0-9/_-]{1,80}$/i.test(error.code)
  ) {
    return error.code;
  }

  return undefined;
}
