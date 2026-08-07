import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { IsAdminGuard } from '../auth/is-admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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
  getOrders(@Query('status') status?: string, @Query('page') page?: string) {
    return this.adminService.getOrders(status, page ? parseInt(page, 10) : 1);
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateOrderStatus(id, status);
  }

  // ── Products ──────────────────────────────────────────────────────────────

  @Get('products')
  getProducts(@Query('status') status?: string, @Query('page') page?: string) {
    return this.adminService.getProducts(status, page ? parseInt(page, 10) : 1);
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.adminService.getProduct(id);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  archiveProduct(@Param('id') id: string) {
    return this.adminService.archiveProduct(id);
  }

  @Delete('products/:id/permanent')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ── Categories ────────────────────────────────────────────────────────────

  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // ── Customers ─────────────────────────────────────────────────────────────

  @Get('customers')
  getCustomers(@Query('search') search?: string, @Query('page') page?: string) {
    return this.adminService.getCustomers(
      search,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.adminService.getCustomer(id);
  }

  @Patch('customers/:id/admin')
  setCustomerAdmin(
    @Param('id') id: string,
    @Body('isAdmin') isAdmin: boolean,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.adminService.setCustomerAdmin(id, isAdmin, user.uid);
  }
}
