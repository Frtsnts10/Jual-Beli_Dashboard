"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Link,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
} from "@heroui/react";
import { Mail, Lock } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Check your email for the confirmation link.");
    }
    setLoading(false);
  };

  // const signInWithGoogle = async () => {
  //   await supabase.auth.signInWithOAuth({
  //     provider: "google",
  //     options: {
  //       redirectTo: `${window.location.origin}/auth/callback`,
  //     },
  //   });
  // };

  return (
    <div className="flex items-center justify-center min-h-screen bg-default-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col gap-1 items-center pb-0 pt-6">
          <h1 className="text-xl font-bold">Create Account</h1>
          <p className="text-small text-default-500">
            Sign up for a new account
          </p>
        </CardHeader>
        <CardBody className="gap-4 py-6">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 text-danger text-small">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-success-50 text-success text-small">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {/* <Button
              fullWidth
              startContent={<Chrome size={20} />}
              variant="flat"
              onPress={signInWithGoogle}
            >
              Continue with Google
            </Button>

            <div className="flex items-center gap-2 my-2">
              <Divider className="flex-1" />
              <span className="text-tiny text-default-400">OR</span>
              <Divider className="flex-1" />
            </div> */}

            <Input
              autoFocus
              endContent={
                <Mail className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
              }
              label="Email"
              placeholder="Enter your email"
              value={email}
              variant="bordered"
              onValueChange={setEmail}
            />
            <Input
              endContent={
                <Lock className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
              }
              label="Password"
              placeholder="Create a password"
              type="password"
              value={password}
              variant="bordered"
              onValueChange={setPassword}
            />
          </div>

          <Button
            fullWidth
            color="primary"
            isLoading={loading}
            onPress={handleSignUp}
          >
            Sign Up
          </Button>
        </CardBody>
        <CardFooter className="flex justify-center pb-6 pt-0">
          <p className="text-small text-default-500">
            Already have an account?{" "}
            <Link className="cursor-pointer" href="/login" size="sm">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
