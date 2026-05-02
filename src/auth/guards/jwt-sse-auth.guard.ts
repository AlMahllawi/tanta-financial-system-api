import { Injectable } from '@nestjs/common';

import { BaseJwtAuthGuard } from './base-jwt-auth.guard.js';

@Injectable()
export class JwtSseAuthGuard extends BaseJwtAuthGuard('jwt-sse') {}
