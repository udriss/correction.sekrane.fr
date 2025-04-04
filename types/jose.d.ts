declare module 'jose' {
  export function jwtVerify(
    jwt: string | Uint8Array,
    key: Uint8Array | KeyLike,
    options?: JWTVerifyOptions
  ): Promise<{ payload: JWTPayload; protectedHeader: JWTVerifyResult['protectedHeader'] }>;

  export interface JWTPayload {
    [key: string]: any;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }

  export interface JWTVerifyOptions {
    algorithms?: string[];
    audience?: string | string[];
    clockTolerance?: string | number;
    issuer?: string | string[];
    maxTokenAge?: string | number;
    subject?: string;
    typ?: string;
    currentDate?: Date;
  }

  export interface JWTVerifyResult {
    payload: JWTPayload;
    protectedHeader: { [key: string]: any };
  }

  export type KeyLike = any;
}
