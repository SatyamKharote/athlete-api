import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

export class TrainingLoadQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  to?: string;
}