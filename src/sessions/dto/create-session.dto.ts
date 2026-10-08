import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const SESSION_TYPES = ['Batting', 'Bowling', 'Fielding', 'Strength', 'Sprint', 'Recovery'] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export class CreateSessionDto {
  @ApiProperty({ example: '2026-10-07', description: 'Date of the session (YYYY-MM-DD)' })
  @IsDateString()
  sessionDate!: string;

  @ApiProperty({ enum: SESSION_TYPES, example: 'Batting' })
  @IsIn(SESSION_TYPES)
  type!: SessionType;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  @Max(600)
  durationMin!: number;

  @ApiProperty({ example: 7, description: 'Rate of perceived exertion, 1 to 10' })
  @IsInt()
  @Min(1)
  @Max(10)
  rpe!: number;

  @ApiPropertyOptional({ example: 'Nets practice' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}