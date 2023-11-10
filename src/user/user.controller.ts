import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key/api-key.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @ApiSecurity('apiKey')
  @UseGuards(ApiKeyGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiSecurity('apiKey')
  @UseGuards(ApiKeyGuard)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @ApiSecurity('apiKey')
  @UseGuards(ApiKeyGuard)
  @Get(':id')
  findOne(@Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number) {
    return this.userService.findOne(id);
  }

  @ApiSecurity('apiKey')
  @UseGuards(ApiKeyGuard)
  @Get(':id/withRelations')
  findOneWithRelations(@Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number) {
    return this.userService.findOne(id, { Company: true, UserCertification: { include: { Certification: true } } });
  }

  @ApiSecurity('apiKey')
  @UseGuards(ApiKeyGuard)
  @Get('byOneTimeCode/:oneTimeCode')
  findOneByOneTimeCode(@Param('oneTimeCode') oneTimeCode: string) {
    return this.userService.findOneByOneTimeCode(oneTimeCode);
  }

  @ApiSecurity('apiKey')
  @UseGuards(ApiKeyGuard)
  @Patch(':id')
  update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiSecurity('apiKey')
  @UseGuards(ApiKeyGuard)
  @Delete(':id')
  remove(@Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number) {
    return this.userService.remove(id);
  }
}
