import { IsBase64 } from 'class-validator';

export class ExecuteTransactionDto {
  @IsBase64()
  transaction: string;
}
