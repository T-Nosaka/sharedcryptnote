import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import {UserInfo} from "@/app/models/userinfo";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.info = new UserInfo(token.jti as string, token.sub as string, session.user);
      return session;
    },
  },
};
