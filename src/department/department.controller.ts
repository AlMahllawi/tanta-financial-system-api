import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all departments' })
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Find a department' })
  findOne(@Param('name') name: string) {
    return this.departmentService.findOne(name);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a department' })
  update(
    @Param('name') name: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(name, updateDepartmentDto);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a department' })
  remove(@Param('name') name: string) {
    return this.departmentService.remove(name);
  }
}
