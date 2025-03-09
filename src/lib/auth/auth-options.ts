// This is a mock file for backwards compatibility with next-auth
// The project has migrated to Supabase Auth but some files still use next-auth imports

export const authOptions = {
  providers: [],
  callbacks: {
    async session({ session }: any) {
      return session;
    },
    async signIn({ user }: any) {
      return true;
    }
  },
  pages: {
    signIn: '/login',
  },
};