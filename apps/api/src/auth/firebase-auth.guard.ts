import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Request } from 'express';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.slice(7);

    try {
      const decoded = await this.firebase.verifyIdToken(token);
      (request as Request & { user: DecodedIdToken }).user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
