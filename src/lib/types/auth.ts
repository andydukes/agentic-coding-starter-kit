export type AuthType = 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY';

export interface AuthConfig {
  keyName?: string;
  keyLocation?: 'header' | 'query';
  tokenPrefix?: string;
}
