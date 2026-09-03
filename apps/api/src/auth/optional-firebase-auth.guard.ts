import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Request } from 'express';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class OptionalFirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return true;
    }

    try {
      const decoded = await this.firebase.verifyIdToken(authHeader.slice(7));
      (request as Request & { user?: DecodedIdToken }).user = decoded;
    } catch {
      // Treat a bad optional token like an anonymous request. Required auth
      // routes continue to use FirebaseAuthGuard.
    }

    return true;
  }
}
