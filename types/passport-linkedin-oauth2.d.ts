declare module 'passport-linkedin-oauth2' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    profileFields?: string[];
    state?: boolean | string;
    passReqToCallback?: boolean;
  }

  export interface StrategyOptionsWithRequest extends StrategyOptions {
    passReqToCallback: true;
  }

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export type VerifyFunctionWithRequest = (
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    constructor(options: StrategyOptionsWithRequest, verify: VerifyFunctionWithRequest);
    name: string;
    authenticate(req: any, options?: any): void;
  }
}