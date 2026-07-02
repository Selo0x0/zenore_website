import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findActiveProducts(@Query('category') category?: string) {
    if (category) {
      return this.productsService.findByCategorySlug(category);
    }
    return this.productsService.findActiveProducts();
  }

  @Get(':slug')
  findActiveProductBySlug(@Param('slug') slug: string) {
    return this.productsService.findActiveProductBySlug(slug);
  }
}
