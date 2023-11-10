import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const globalApiKey = this.configService.get('GLOBAL_API_KEY');

    if (!globalApiKey) {
      throw new HttpException('No authorization key found.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return request.headers.authorization === globalApiKey;
  }
}
