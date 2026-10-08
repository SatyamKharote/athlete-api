import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { UpdateSessionDto } from './dto/update-session.dto.js';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto.js';

@ApiTags('sessions')
@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('athletes/:athleteId/sessions')
  create(
    @Param('athleteId', ParseUUIDPipe) athleteId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionsService.create(athleteId, dto);
  }

  @Get('athletes/:athleteId/sessions')
  findAllForAthlete(
    @Param('athleteId', ParseUUIDPipe) athleteId: string,
    @Query() query: ListSessionsQueryDto,
  ) {
    return this.sessionsService.findAllForAthlete(athleteId, query);
  }

  @Get('sessions/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch('sessions/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, dto);
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.remove(id);
  }
}