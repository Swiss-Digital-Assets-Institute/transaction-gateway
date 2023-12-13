import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../api-key/api-key.guard';
import { HashgraphService } from './hashgraph.service';
import { ExecuteTransactionDto } from './dto/execute-transaction.dto';
import { ExecuteTransactionResponseDto } from './dto/execute-transaction.response.dto';
import { AccountIdResponseDto } from './dto/account-id.response.dto';

@Controller('transaction')
@ApiTags('transaction')
@ApiSecurity('apiKey')
@UseGuards(ApiKeyGuard)
export class HashgraphController {
  constructor(private readonly hashgraphService: HashgraphService) {}

  @Post('/execute')
  @ApiOkResponse({
    description: 'The request has been successfully processed.',
    type: [ExecuteTransactionResponseDto],
  })
  @ApiBadRequestResponse({ description: 'The request does not fulfill the requirements.' })
  @ApiForbiddenResponse({ description: 'Unauthorized - The department API key must be provided.' })
  executeTransaction(@Body() body: ExecuteTransactionDto) {
    return this.hashgraphService.executeTransaction(body.transaction);
  }

  @Get('/operatorAccountId')
  @ApiOkResponse({
    description: 'The request has been successfully processed.',
    type: [AccountIdResponseDto],
  })
  @ApiBadRequestResponse({ description: 'The request does not fulfill the requirements.' })
  @ApiForbiddenResponse({ description: 'Unauthorized - The department API key must be provided.' })
  getOperatorAccountId(): Promise<AccountIdResponseDto> {
    return this.hashgraphService.getOperatorAccountId();
  }
}
