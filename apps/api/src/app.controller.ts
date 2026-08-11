import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health/database')
  getDatabaseHealth() {
    return this.appService.getDatabaseHealth();
  }

  // TEMPORARY — verifies Bugsink is actually receiving events. Remove after testing.
  @Get('debug-bugsink-test')
  debugBugsinkTest() {
    throw new Error(
      'Bugsink wiring test — safe to ignore, this was triggered on purpose.',
    );
  }
}
