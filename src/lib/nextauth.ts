import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    newUser: '/account',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const customer = await prisma.customer.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!customer || !customer.hashedPassword) return null;

        const isValid = await bcrypt.compare(credentials.password, customer.hashedPassword);
        if (!isValid) return null;

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          image: customer.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as typeof session.user & { id: string }).id = token.id as string;
      }
      return session;
    },
  },
};
