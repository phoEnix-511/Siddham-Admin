import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/login',
    newUser: '/account',
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const customer = await prisma.customer.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            hashedPassword: true,
            forcePasswordReset: true,
          },
        });

        if (!customer || !customer.hashedPassword) {
          throw new Error('Invalid email or password');
        }

        const passwordValid = await bcrypt.compare(credentials.password, customer.hashedPassword);

        if (!passwordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          image: customer.image,
          forcePasswordReset: customer.forcePasswordReset,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.forcePasswordReset = (user as any).forcePasswordReset;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as typeof session.user & { id: string, forcePasswordReset?: boolean }).id = token.id as string;
        (session.user as typeof session.user & { forcePasswordReset?: boolean }).forcePasswordReset = token.forcePasswordReset as boolean;
      }
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      if (user?.id) {
        await prisma.customer.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        }).catch(err => console.error('Failed to update lastLogin:', err));
      }
    },
  },
};

export default NextAuth(authOptions);
