import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DepartmentService } from './department.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Department } from './entities/department.entity.js';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, type: Department })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all departments' })
  @ApiResponse({ status: 200, type: [Department] })
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Find a department' })
  @ApiResponse({ status: 200, type: Department })
  findOne(@Param('name') name: string) {
    return this.departmentService.findOne(name);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, type: Department })
  update(
    @Param('name') name: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(name, updateDepartmentDto);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({ status: 200, type: Department })
  remove(@Param('name') name: string) {
    return this.departmentService.remove(name);
  }
}
