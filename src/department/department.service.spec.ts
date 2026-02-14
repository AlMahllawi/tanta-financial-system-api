import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentService } from './department.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { Department } from './entities/department.entity.js';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a department', async () => {
      const createDepartmentDto: CreateDepartmentDto = {
        name: 'Computer Science',
      };
      const createdDepartment = {
        name: createDepartmentDto.name,
        managerId: null,
      };

      prismaMock.department.create.mockResolvedValue(createdDepartment);

      const result = await service.create(createDepartmentDto);

      expect(prismaMock.department.create).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Department);
    });

    it('should throw ConflictException if department already exists', async () => {
      const createDepartmentDto: CreateDepartmentDto = {
        name: 'Computer Science',
      };

      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['name'] },
        },
      );

      prismaMock.department.create.mockRejectedValue(error);

      await expect(service.create(createDepartmentDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of departments', async () => {
      const departments = [
        {
          name: 'Computer Science',
          managerId: 1,
        },
      ];

      prismaMock.department.findMany.mockResolvedValue(departments);

      const result = await service.findAll();

      expect(prismaMock.department.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Department);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.department.findMany.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    const name = 'Computer Science';

    it('should return a department if found', async () => {
      const department = {
        name,
        managerId: 1,
      };

      prismaMock.department.findUnique.mockResolvedValue(department);

      const result = await service.findOne(name);

      expect(prismaMock.department.findUnique).toHaveBeenCalledWith({
        where: { name },
      });
      expect(result).toBeInstanceOf(Department);
    });

    it('should throw NotFoundException if department not found', async () => {
      prismaMock.department.findUnique.mockResolvedValue(null);

      await expect(service.findOne(name)).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.department.findUnique.mockRejectedValue(error);

      await expect(service.findOne(name)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    const name = 'Computer Science';
    const updateDepartmentDto: UpdateDepartmentDto = {
      name: 'New Department Name',
      managerId: 2,
    };

    it('should successfully update a department', async () => {
      const updatedDepartment = {
        name: updateDepartmentDto.name as string,
        managerId: updateDepartmentDto.managerId ?? null,
      };

      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        departmentName: name,
      } as any);

      prismaMock.department.update.mockResolvedValue(updatedDepartment);

      const result = await service.update(name, updateDepartmentDto);

      expect(prismaMock.department.update).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Department);
    });

    it('should throw NotFoundException if manager user check fails', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.update(name, updateDepartmentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if manager is not member of department', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        departmentName: 'Other Dept',
      } as any);

      await expect(service.update(name, updateDepartmentDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException on duplicate name', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        departmentName: name,
      } as any);

      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['name'] },
        },
      );

      prismaMock.department.update.mockRejectedValue(error);

      await expect(service.update(name, updateDepartmentDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if manager already manages another department', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        departmentName: name,
      } as any);

      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['managerId'] },
        },
      );

      prismaMock.department.update.mockRejectedValue(error);

      await expect(service.update(name, updateDepartmentDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if department to update does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        departmentName: name,
      } as any);

      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      prismaMock.department.update.mockRejectedValue(error);

      await expect(service.update(name, updateDepartmentDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const name = 'Computer Science';

    it('should successfully remove a department', async () => {
      const deletedDepartment = {
        name,
        managerId: 1,
      };

      prismaMock.department.delete.mockResolvedValue(deletedDepartment);

      const result = await service.remove(name);

      expect(prismaMock.department.delete).toHaveBeenCalledWith({
        where: { name },
      });
      expect(result).toBeInstanceOf(Department);
    });

    it('should throw NotFoundException if department not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      prismaMock.department.delete.mockRejectedValue(error);

      await expect(service.remove(name)).rejects.toThrow(NotFoundException);
    });
  });
});
