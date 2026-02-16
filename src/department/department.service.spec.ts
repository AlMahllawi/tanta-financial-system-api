import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentService } from './department.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { ConflictException, NotFoundException } from '@nestjs/common';

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

      await service.create(createDepartmentDto);

      expect(prismaMock.department.create).toHaveBeenCalledTimes(1);
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

      await service.findAll();

      expect(prismaMock.department.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const name = 'Computer Science';

    it('should return a department if found', async () => {
      const department = {
        name,
        managerId: 1,
      };

      prismaMock.department.findUniqueOrThrow.mockResolvedValue(department);

      await service.findOne(name);

      expect(prismaMock.department.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { name },
      });
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

      await service.update(name, updateDepartmentDto);

      expect(prismaMock.department.update).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if manager does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.update(name, updateDepartmentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if manager is not in the department', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        departmentName: 'Other Department',
      } as any);

      await expect(service.update(name, updateDepartmentDto)).rejects.toThrow(
        ConflictException,
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

      await service.remove(name);

      expect(prismaMock.department.delete).toHaveBeenCalledWith({
        where: { name },
      });
    });
  });
});
