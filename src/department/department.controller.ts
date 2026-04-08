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
  Query,
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
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { DepartmentQueryDto } from './dto/department-query.dto.js';
import {
  matchUniqueConstraint,
  matchRecordsNotFound,
  matchDriverAdapter,
} from '../prisma/prisma.matchers.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../../prisma/generated/enums.js';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
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
    matchers: matchUniqueConstraint('name'),
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all departments' })
  @ApiPaginatedResponse(Department)
  findAll(@Query() queryDto: DepartmentQueryDto) {
    return this.departmentService.findAll(queryDto);
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
    matchers: matchRecordsNotFound('Department'),
  })
  findOne(@Param('name') name: string) {
    return this.departmentService.findOne(name);
  }

  @Patch(':name')
  @Roles(UserRole.ADMIN)
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
      matchers: matchUniqueConstraint('name'),
    },
    {
      status: HttpStatus.CONFLICT,
      description:
        'The specified manager is already managing another department',
      errorCode: ErrorCode.MANAGER_ALREADY_MANAGES_DEPARTMENT,
      args: { managerId: 1 },
      matchers: [matchUniqueConstraint('"managerId"')],
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No department was found with such name',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { name: 'Unknown Department' },
      matchers: matchRecordsNotFound('Department'),
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'The specified manager user was not found',
      errorCode: ErrorCode.MANAGER_NOT_FOUND,
      args: { managerId: 1 },
      matchers: [matchDriverAdapter('23503', 'fk_department_manager')],
    },
  )
  @ApiErrorResponses({
    status: HttpStatus.CONFLICT,
    description: 'The specified manager does not belong to this department',
    errorCode: ErrorCode.MANAGER_NOT_MEMBER_OF_DEPARTMENT,
    args: { managerId: 1, departmentName: 'Engineering' },
  })
  update(
    @Param('name') name: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(name, updateDepartmentDto);
  }

  @Delete(':name')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a department' })
  @ApiOkResponse({
    type: Department,
    description: 'Department deleted successfully',
  })
  @ApiPrismaErrorResponses(
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No department was found with such name',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { name: 'Unknown Department' },
      matchers: matchRecordsNotFound('Department'),
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'Cannot delete department with existing members',
      errorCode: ErrorCode.DEPARTMENT_HAS_MEMBERS,
      args: { name: 'Computer Science' },
      matchers: [matchDriverAdapter('23001', 'fk_user_department')],
    },
  )
  remove(@Param('name') name: string) {
    return this.departmentService.remove(name);
  }
}
