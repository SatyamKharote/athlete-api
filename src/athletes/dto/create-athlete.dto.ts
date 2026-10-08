import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAthleteDto {
  @ApiProperty({ example: 'Rohit Patil' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'rohit@test.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Cricket' })
  @IsString()
  @IsNotEmpty()
  sport!: string;
}