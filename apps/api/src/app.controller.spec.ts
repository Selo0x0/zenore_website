jest.mock(
  '@zenore/db',
  () => ({
    createPrismaClient: jest.fn(),
  }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  const appService = {
    getHello: jest.fn(() => ({
      name: 'Zenore API',
      status: 'ok',
    })),
    getDatabaseHealth: jest.fn(() =>
      Promise.resolve({
        status: 'ok',
        productCount: 0,
      }),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('returns API health details', () => {
    expect(appController.getHello()).toEqual({
      name: 'Zenore API',
      status: 'ok',
    });
  });

  it('returns database health details', async () => {
    await expect(appController.getDatabaseHealth()).resolves.toEqual({
      status: 'ok',
      productCount: 0,
    });
  });
});
