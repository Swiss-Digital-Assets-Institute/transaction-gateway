import { ApiProperty } from '@nestjs/swagger';

export class AccountIdResponseDto {
  @ApiProperty({
    type: String,
    nullable: false,
    description: 'Executor account id.',
  })
  accountId: string;
}
