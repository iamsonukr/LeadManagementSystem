declare module 'passport-jwt' {
  import { Request } from 'express';

  export interface StrategyOptions {
    jwtFromRequest: (request: Request) => string | null;
    ignoreExpiration?: boolean;
    secretOrKey: string;
  }

  export class Strategy {
    constructor(
      options: StrategyOptions,
      verify?: (...args: unknown[]) => unknown,
    );
  }

  export const ExtractJwt: {
    fromAuthHeaderAsBearerToken(): (request: Request) => string | null;
  };
}
