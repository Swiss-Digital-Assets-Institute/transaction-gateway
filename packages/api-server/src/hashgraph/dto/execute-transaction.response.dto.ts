import { TransactionReceipt } from '@hashgraph/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TransactionReceiptDto {
  @ApiProperty({ nullable: false })
  status: number;
  @ApiProperty({ nullable: false })
  accountId: string;
  @ApiProperty({ nullable: false })
  fileId: string;
  @ApiProperty({ nullable: false })
  contractId: string;
  @ApiProperty({ nullable: false })
  topicId: string;
  @ApiProperty({ nullable: false })
  tokenId: string;
  @ApiProperty({ nullable: false })
  scheduleId: string;
  @ApiProperty({ nullable: false })
  exchangeRate: string;
  @ApiProperty({ nullable: false })
  topicSequenceNumber: string;
  @ApiProperty({ nullable: false })
  topicRunningHash: string;
  @ApiProperty({ nullable: false })
  totalSupply: string;
  @ApiProperty({ nullable: false })
  scheduledTransactionId: string;
  @ApiProperty({ nullable: false, type: [] })
  serials: typeof TransactionReceipt.prototype.serials;
  @ApiProperty({ nullable: false, type: [] })
  duplicates: typeof TransactionReceipt.prototype.duplicates;
  @ApiProperty({ nullable: false, type: [] })
  children: typeof TransactionReceipt.prototype.children;
}
export class TransactionResponseDto {
  @ApiProperty({ nullable: false })
  nodeId: string;
  @ApiProperty({ nullable: false })
  transactionHash: string;
  @ApiProperty({ nullable: false })
  transactionId: string;
}

export class ExecuteTransactionResponseDto {
  @ApiProperty({
    type: TransactionReceiptDto,
    nullable: false,
    description: 'Receipt of executed transaction.',
  })
  @Type(() => TransactionReceiptDto)
  transactionReceipt: TransactionReceiptDto;

  @ApiProperty({
    type: TransactionResponseDto,
    nullable: false,
    description: 'Response of executed transaction.',
  })
  @Type(() => TransactionResponseDto)
  transactionResponse: TransactionResponseDto;
}
