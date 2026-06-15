import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Validates the access token via the 'jwt' Passport strategy. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
