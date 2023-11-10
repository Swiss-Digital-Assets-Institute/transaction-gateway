import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OneTimeCodeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  oneTimeCode!: string;
}
