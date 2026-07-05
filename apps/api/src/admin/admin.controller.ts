import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { IsAdminGuard } from '../auth/is-admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(FirebaseAuthGuard, IsAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('orders/recent')
  getRecentOrders() {
    return this.adminService.getRecentOrders();
  }

  @Get('orders')
  getOrders(
    @Query('status') status?: string,
    @Query('page') page?: string,
  ) {
    return this.adminService.getOrders(status, page ? parseInt(page, 10) : 1);
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }
}
