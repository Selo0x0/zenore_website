import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findVisibleCategories();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const cat = await this.productsService.findVisibleCategoryBySlug(slug);
    if (!cat) throw new NotFoundException('Category not found.');
    return cat;
  }
}
