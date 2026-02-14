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
} from '@nestjs/common';
import { DepartmentService } from './department.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Department } from './entities/department.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiResponses } from '../common/decorators/http.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponses(
    {
      status: HttpStatus.CREATED,
      type: Department,
      description: 'Department created successfully',
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'A department already exists with the same name',
      errorCode: ErrorCode.DEPARTMENT_ALREADY_EXISTS,
      args: { name: 'Computer Science' },
    },
  )
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all departments' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: [Department],
    description: 'Departments retrieved successfully',
  })
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Retrieve a department' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: Department,
      description: 'Department retrieved successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No department was found with such name',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { name: 'Unknown Department' },
    },
  )
  findOne(@Param('name') name: string) {
    return this.departmentService.findOne(name);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: Department,
      description: 'Department updated successfully',
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'A department already exists with the same name',
      errorCode: ErrorCode.DEPARTMENT_ALREADY_EXISTS,
      args: { name: 'Computer Science' },
    },
    {
      status: HttpStatus.CONFLICT,
      description:
        'The specified manager is already managing another department',
      errorCode: ErrorCode.MANAGER_ALREADY_MANAGES_DEPARTMENT,
      args: { managerId: 1 },
    },
    {
      status: HttpStatus.CONFLICT,
      description: 'The specified manager does not belong to this department',
      errorCode: ErrorCode.MANAGER_NOT_MEMBER_OF_DEPARTMENT,
      args: { managerId: 1, departmentName: 'Engineering' },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No department was found with such name',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { name: 'Unknown Department' },
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'The specified manager user was not found',
      errorCode: ErrorCode.MANAGER_NOT_FOUND,
      args: { managerId: 1 },
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
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: Department,
      description: 'Department deleted successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No department was found with such name',
      errorCode: ErrorCode.DEPARTMENT_NOT_FOUND,
      args: { name: 'Unknown Department' },
    },
  )
  remove(@Param('name') name: string) {
    return this.departmentService.remove(name);
  }
}
