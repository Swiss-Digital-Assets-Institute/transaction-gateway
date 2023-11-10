import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  Email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  FirstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  LastName: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  CompanyId?: number;
}
