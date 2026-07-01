import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: App;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.app =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            credential: cert({
              projectId: this.config.getOrThrow('FIREBASE_PROJECT_ID'),
              clientEmail: this.config.getOrThrow('FIREBASE_CLIENT_EMAIL'),
              privateKey: this.config
                .getOrThrow<string>('FIREBASE_PRIVATE_KEY')
                .replace(/\\n/g, '\n'),
            }),
          });
  }

  verifyIdToken(token: string): Promise<DecodedIdToken> {
    return getAuth(this.app).verifyIdToken(token);
  }
}
