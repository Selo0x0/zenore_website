import { Controller, HttpCode, Post, UseGuards, Body } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post('me')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  upsertMe(
    @CurrentUser() user: DecodedIdToken,
    @Body('displayName') displayName?: string,
  ) {
    return this.customers.upsertFromToken(user, displayName);
  }
}
