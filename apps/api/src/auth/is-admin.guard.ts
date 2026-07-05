import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class IsAdminGuard implements CanActivate {
  constructor(private readonly customers: CustomersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { uid: string } }>();
    const uid = request.user?.uid;
    if (!uid) return false;

    const customer = await this.customers.findByFirebaseUid(uid);
    if (!customer.isAdmin) {
      throw new ForbiddenException('Admin yetkisi gereklidir.');
    }
    return true;
  }
}
