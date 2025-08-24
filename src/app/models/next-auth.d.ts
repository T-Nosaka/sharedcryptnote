import { UserInfo } from '@/app/models/userinfo';

declare module "next-auth" {
  /**
   * userの拡張
   */
  interface Session {
    user: {
      info: UserInfo?,
    } & DefaultSession["user"];
  }
}