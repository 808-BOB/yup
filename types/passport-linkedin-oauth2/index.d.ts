declare module 'passport-linkedin-oauth2' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    state?: boolean;
    profileFields?: string[];
  }

  export interface Profile {
    id: string;
    displayName: string;
    name: {
      givenName: string;
      familyName: string;
    };
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
    _json: any;
    profileUrl?: string;
  }

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any, info?: any) => void
      ) => void
    );
  }
}