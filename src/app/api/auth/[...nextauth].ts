import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";

// Use .env.local variable names for Microsoft Entra External ID
const ENTRA_CLIENT_ID = process.env.AUTH_MICROSOFT_ENTRA_ID_ID || "YOUR_CLIENT_ID";
const ENTRA_CLIENT_SECRET = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET || "YOUR_CLIENT_SECRET";
const ENTRA_ISSUER = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER || "https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0";

export const authConfig: NextAuthOptions = {
  providers: [
    {
      id: "entra-oidc",
      name: "Microsoft Entra ID",
      type: "oauth",
      wellKnown: `${ENTRA_ISSUER}/.well-known/openid-configuration`,
      clientId: ENTRA_CLIENT_ID,
      clientSecret: ENTRA_CLIENT_SECRET,
      authorization: { params: { scope: "openid profile email" } },
      idToken: true,
      checks: ["pkce", "state"],
      profile(profile: { sub: string; name?: string; email?: string; picture?: string }) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
