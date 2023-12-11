import { ApiProperty } from '@nestjs/swagger';
import { IsBase64 } from 'class-validator';

export class ExecuteTransactionDto {
  @IsBase64()
  @ApiProperty({
    type: String,
    nullable: false,
    description: 'Base64 encoded transaction bytes.',
  })
  transaction: string;
}
