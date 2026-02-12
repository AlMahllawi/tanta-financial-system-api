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
  @ApiResponses({
    status: HttpStatus.CREATED,
    type: Department,
    description: 'Department created successfully',
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all departments' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: [Department],
    description: 'Departments retrieved successfully',
  })
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Find a department' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: Department,
    description: 'Department retrieved successfully',
  })
  findOne(@Param('name') name: string) {
    return this.departmentService.findOne(name);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: Department,
    description: 'Department updated successfully',
  })
  update(
    @Param('name') name: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(name, updateDepartmentDto);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: Department,
    description: 'Department deleted successfully',
  })
  remove(@Param('name') name: string) {
    return this.departmentService.remove(name);
  }
}
