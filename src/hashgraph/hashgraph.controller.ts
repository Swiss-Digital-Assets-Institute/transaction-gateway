import { Body, Controller, Get, Post } from '@nestjs/common';
import { HashgraphService } from './hashgraph.service';
import { ExecuteTransactionDto } from './dto/execute-transaction.dto';
import { AccountIdResponse } from './definitions';

@Controller('transaction')
export class HashgraphController {
  constructor(private readonly hashgraphService: HashgraphService) {}

  @Post('/execute')
  executeTransaction(@Body() body: ExecuteTransactionDto) {
    return this.hashgraphService.executeTransaction(body.transaction);
  }

  @Get('/operatorAccountId')
  getOperatorAccountId(): Promise<AccountIdResponse> {
    return this.hashgraphService.getOperatorAccountId();
  }
}
