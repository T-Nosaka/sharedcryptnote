import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import {UserInfo} from "@/app/models/userinfo";
import { isEmailAllowed } from "@/app/lib/allowlist";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // ALLOWUSERS 設定時は許可メアドのみログイン可（新規ログインの入口対策）
      if (!isEmailAllowed(user?.email)) {
        console.warn('[allowlist] blocked sign-in attempt: ' + user?.email);
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      session.user.info = new UserInfo(token.jti as string, token.sub as string, session.user);
      return session;
    },
  },
};
