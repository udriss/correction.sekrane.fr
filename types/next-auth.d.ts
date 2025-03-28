import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username?: string; // Add username field
  }
  
  interface Session {
    user: {
      id: string;
      name: string;
      email?: string; // Make email optional
      username?: string; // Add username field
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string; // Add username field
  }
}
