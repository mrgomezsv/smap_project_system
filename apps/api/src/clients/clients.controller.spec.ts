import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

describe('ClientsController', () => {
  let controller: ClientsController;

  const mockClientsService = {
    findById: jest.fn(),
    update: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
  };

  const mockPrisma = {
    client: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        { provide: ClientsService, useValue: mockClientsService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    controller = module.get(ClientsController);
  });

  describe('route ordering', () => {
    it('GET /clients/me está registrado antes que GET /clients/:id', () => {
      const prototype = ClientsController.prototype as unknown as Record<
        string,
        unknown
      >;
      const own = Object.getOwnPropertyNames(prototype);
      const getIndex = (name: string) => own.findIndex((n) => n === name);
      const meIdx = getIndex('me');
      const findOneIdx = getIndex('findOne');
      expect(meIdx).toBeGreaterThanOrEqual(0);
      expect(findOneIdx).toBeGreaterThanOrEqual(0);
      expect(meIdx).toBeLessThan(findOneIdx);
    });

    it('PATCH /clients/me está registrado antes que PATCH /clients/:id', () => {
      const own = Object.getOwnPropertyNames(ClientsController.prototype);
      const meIdx = own.findIndex((n) => n === 'patchMe');
      const updateIdx = own.findIndex((n) => n === 'update');
      expect(meIdx).toBeLessThan(updateIdx);
    });
  });

  describe('me', () => {
    const userByUserId: AuthUser = {
      uid: 'fb-1',
      email: 'me@test.com',
      name: 'Me',
      userId: 7,
      token: 'tok',
    };

    it('resuelve por userId primero', async () => {
      mockPrisma.client.findFirst.mockResolvedValueOnce({
        id: 11,
        email: 'me@test.com',
      });
      mockClientsService.findById.mockResolvedValueOnce({ id: 11 });
      const result = await controller.me(userByUserId);
      expect(mockPrisma.client.findUnique).not.toHaveBeenCalled();
      expect(mockClientsService.findById).toHaveBeenCalledWith(11);
      expect(result).toEqual({ id: 11 });
    });

    it('hace fallback a email si no encuentra por userId', async () => {
      mockPrisma.client.findFirst.mockResolvedValueOnce(null);
      mockPrisma.client.findUnique.mockResolvedValueOnce({
        id: 22,
        email: 'me@test.com',
      });
      mockClientsService.findById.mockResolvedValueOnce({ id: 22 });
      const result = await controller.me(userByUserId);
      expect(mockClientsService.findById).toHaveBeenCalledWith(22);
      expect(result).toEqual({ id: 22 });
    });

    it('lanza NotFound si no existe Client asociado', async () => {
      mockPrisma.client.findFirst.mockResolvedValueOnce(null);
      mockPrisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(controller.me(userByUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('patchMe', () => {
    it('actualiza el perfil propio con userId', async () => {
      const user: AuthUser = {
        uid: 'fb-1',
        email: 'me@test.com',
        name: 'Me',
        userId: 7,
        token: 'tok',
      };
      mockPrisma.client.findFirst.mockResolvedValueOnce({
        id: 11,
        email: 'me@test.com',
      });
      mockClientsService.update.mockResolvedValueOnce({ id: 11, phone: '555' });
      const result = await controller.patchMe(user, { phone: '555' });
      expect(mockClientsService.update).toHaveBeenCalledWith(11, {
        phone: '555',
      });
      expect(result).toEqual({ id: 11, phone: '555' });
    });
  });
});
