import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { DepartmentService } from './department.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Department } from './entities/department.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PrismaExceptionFilter } from '../prisma/filters/exception.filter.js';
import { PrismaError } from 'prisma-error-enum';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(PrismaExceptionFilter)
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiCreatedResponse({
    type: Department,
    description: 'Department created successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.CONFLICT,
    description: 'A department already exists with the same name',
    errorCode: ErrorCode.DEPARTMENT_ALREADY_EXISTS,
    args: { name: 'Computer Science' },
    prisma: {
      error: PrismaError.UniqueConstraintViolation,
      matcher: (meta) => meta.field === 'name',
    },
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all departments' })
  @ApiOkResponse({
    type: [Department],
    description: 'Departments retrieved successfully',
  })
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Retrieve a department' })
  @ApiOkResponse({
    type: Department,
    description: 'Department retrieved successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No department was found with such name',
    errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
    args: { name: 'Unknown Department' },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  findOne(@Param('name') name: string) {
    return this.departmentService.findOne(name);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a department' })
  @ApiOkResponse({
    type: Department,
    description: 'Department updated successfully',
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.CONFLICT,
      description: 'A department already exists with the same name',
      errorCode: ErrorCode.DEPARTMENT_ALREADY_EXISTS,
      args: { name: 'Computer Science' },
      prisma: {
        error: PrismaError.UniqueConstraintViolation,
        matcher: (meta) => meta.field === 'name',
      },
    },
    {
      status: HttpStatus.CONFLICT,
      description:
        'The specified manager is already managing another department',
      errorCode: ErrorCode.MANAGER_ALREADY_MANAGES_DEPARTMENT,
      args: { managerId: 1 },
      prisma: {
        error: PrismaError.UniqueConstraintViolation,
        matcher: (meta) => meta.field === 'managerId',
      },
    },
  )
  @ApiErrorResponses({
    status: HttpStatus.CONFLICT,
    description: 'The specified manager does not belong to this department',
    errorCode: ErrorCode.MANAGER_NOT_MEMBER_OF_DEPARTMENT,
    args: { managerId: 1, departmentName: 'Engineering' },
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No department was found with such name',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { name: 'Unknown Department' },
      prisma: { error: PrismaError.RecordsNotFound },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'The specified manager user was not found',
      errorCode: ErrorCode.MANAGER_NOT_FOUND,
      args: { managerId: 1 },
      prisma: {
        error: PrismaError.ForeignConstraintViolation,
        matcher: (meta) => meta.field === 'managerId',
      },
    },
  )
  update(
    @Param('name') name: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(name, updateDepartmentDto);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiOkResponse({
    type: Department,
    description: 'Department deleted successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No department was found with such name',
    errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
    args: { name: 'Unknown Department' },
    prisma: { error: PrismaError.RecordsNotFound },
  })
  remove(@Param('name') name: string) {
    return this.departmentService.remove(name);
  }
}
