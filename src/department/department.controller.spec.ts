import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentController } from './department.controller.js';
import { DepartmentService } from './department.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Department } from './entities/department.entity.js';

describe('DepartmentController', () => {
  let controller: DepartmentController;
  let departmentService: DeepMockProxy<DepartmentService>;

  beforeEach(async () => {
    departmentService = mockDeep<DepartmentService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [
        {
          provide: DepartmentService,
          useValue: departmentService,
        },
      ],
    }).compile();

    controller = module.get<DepartmentController>(DepartmentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDepartmentDto: CreateDepartmentDto = {
      name: 'Computer Science',
    };

    it('should successfully create a department', async () => {
      departmentService.create.mockResolvedValue(new Department());
      await controller.create(createDepartmentDto);
      expect(departmentService['create']).toHaveBeenCalledWith(
        createDepartmentDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of departments', async () => {
      departmentService.findAll.mockResolvedValue([new Department()]);
      await controller.findAll();
      expect(departmentService['findAll']).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const name = 'Computer Science';

    it('should return a department if found', async () => {
      departmentService.findOne.mockResolvedValue(new Department());
      await controller.findOne(name);
      expect(departmentService['findOne']).toHaveBeenCalledWith(name);
    });
  });

  describe('update', () => {
    const name = 'Computer Science';
    const updateDepartmentDto: UpdateDepartmentDto = {
      name: 'New Name',
    };

    it('should successfully update a department', async () => {
      departmentService.update.mockResolvedValue(new Department());
      await controller.update(name, updateDepartmentDto);
      expect(departmentService['update']).toHaveBeenCalledWith(
        name,
        updateDepartmentDto,
      );
    });
  });

  describe('remove', () => {
    const name = 'Computer Science';

    it('should successfully remove a department', async () => {
      departmentService.remove.mockResolvedValue(new Department());
      await controller.remove(name);
      expect(departmentService['remove']).toHaveBeenCalledWith(name);
    });
  });
});
