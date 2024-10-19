import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
// import { supabase } from "@/utils/supabase";

const handler = NextAuth({
  providers: [
    // OAuth authentication providers...
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/github`,
      authorization: {
        params: {
          scope: "read:user,user:email", // Ensure you request the necessary scopes
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  // callbacks: {
  //   async signIn({ user, account, profile }) {
  //     const email = profile.email; // Get the email from the profile
  //     const name = profile.name; // Get the name from the profile
  //     const avatar = profile.picture; // Get the avatar from the profile

  //     // Check if user already exists in Supabase
  //     const { data, error } = await supabase
  //       .from("users")
  //       .upsert({ email, name, avatar }, { onConflict: ["email"] });

  //     if (error) {
  //       console.error("Error inserting user into Supabase:", error);
  //       return false; // Prevent sign-in on error
  //     }
  //     return true; // Allow sign-in if no errors
  //   },
  //   async session({ session, token }) {
  //     // Attach user id and other info to the session
  //     session.user.id = token.id; // This assumes your token has the user ID
  //     return session;
  //   },
  // },
});

export { handler as GET, handler as POST };
