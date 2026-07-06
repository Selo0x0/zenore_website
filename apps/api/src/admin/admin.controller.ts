import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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

  // ── Products ──────────────────────────────────────────────────────────────

  @Get('products')
  getProducts(
    @Query('status') status?: string,
    @Query('page') page?: string,
  ) {
    return this.adminService.getProducts(status, page ? parseInt(page, 10) : 1);
  }

  @Post('products')
  createProduct(@Body() body: Record<string, unknown>) {
    return this.adminService.createProduct(body as any);
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.adminService.getProduct(id);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateProduct(id, body as any);
  }

  @Delete('products/:id')
  archiveProduct(@Param('id') id: string) {
    return this.adminService.archiveProduct(id);
  }

  // ── Categories ────────────────────────────────────────────────────────────

  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() body: Record<string, unknown>) {
    return this.adminService.createCategory(body as any);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateCategory(id, body as any);
  }
}
