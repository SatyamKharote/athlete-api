import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AthletesService } from './athletes.service.js';
import { CreateAthleteDto } from './dto/create-athlete.dto.js';
import { UpdateAthleteDto } from './dto/update-athlete.dto.js';
import { ListAthletesQueryDto } from './dto/list-athletes-query.dto.js';

@ApiTags('athletes')
@Controller('athletes')
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Post()
  create(@Body() dto: CreateAthleteDto) {
    return this.athletesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListAthletesQueryDto) {
    return this.athletesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.athletesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAthleteDto) {
    return this.athletesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.athletesService.remove(id);
  }
}