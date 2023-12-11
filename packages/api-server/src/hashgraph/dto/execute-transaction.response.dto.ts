import { TransactionReceipt, TransactionResponse } from '@hashgraph/sdk';
import { ApiProperty } from '@nestjs/swagger';

export class ExecuteTransactionResponseDto {
  @ApiProperty({
    type: TransactionReceipt,
    nullable: false,
    description: 'Receipt of executed transaction.',
  })
  transactionReceipt: TransactionReceipt;
  @ApiProperty({
    type: TransactionResponse,
    nullable: false,
    description: 'Response of executed transaction.',
  })
  transactionResponse: TransactionResponse;
}
