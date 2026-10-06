import { PrismaAdapter } from "@auth/prisma-adapter";
import { type Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { env } from "@/env";
import { db } from "@/server/db";
import NextAuth, { type Session, type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      hasAccess: boolean;
      location?: string;
      role: string;
      isAdmin: boolean;
      isSuperAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    hasAccess: boolean;
    role: string;
  }
}

const isAdminRole = (role?: string | null) =>
  role === "ADMIN" || role === "SUPER_ADMIN";

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.hasAccess = user.hasAccess;
        token.name = user.name;
        token.image = user.image;
        token.picture = user.image;
        token.location = (user as Session["user"]).location;
        token.role = user.role;
        token.isAdmin = isAdminRole(user.role);
        token.isSuperAdmin = user.role === "SUPER_ADMIN";
      }

      if (trigger === "update" && (session as Session)?.user) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
        });

        if (session) {
          token.name = (session as Session).user.name;
          token.image = (session as Session).user.image;
          token.picture = (session as Session).user.image;
          token.location = (session as Session).user.location;
        }

        if (dbUser) {
          token.hasAccess = dbUser.hasAccess ?? false;
          token.role = dbUser.role;
          token.isAdmin = isAdminRole(dbUser.role);
          token.isSuperAdmin = dbUser.role === "SUPER_ADMIN";
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.hasAccess = token.hasAccess as boolean;
      session.user.location = token.location as string;
      session.user.role = token.role as string;
      session.user.isAdmin = isAdminRole(token.role as string);
      session.user.isSuperAdmin = token.role === "SUPER_ADMIN";
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { id: true, hasAccess: true, role: true },
        });

        if (dbUser) {
          user.hasAccess = dbUser.hasAccess;
          user.role = dbUser.role;
        } else {
          user.hasAccess = false;
          user.role = "USER";
        }
      }

      return true;
    },
  },

  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
});
