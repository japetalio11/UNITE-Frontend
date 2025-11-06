"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Checkbox } from "@heroui/checkbox";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Sign in:", { email, password, rememberMe });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="w-full max-w-[360px]">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold mb-6 text-danger">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium mb-1.5 block"
              >
                Email
                <span className="text-danger ml-1" aria-label="required">
                  *
                </span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="johndoe@email.com"
                size="md"
                variant="bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
                autoComplete="email"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium mb-1.5 block"
              >
                Password
                <span className="text-danger ml-1" aria-label="required">
                  *
                </span>
              </label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                size="md"
                variant="bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
                autoComplete="current-password"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400",
                }}
                endContent={
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="focus:outline-none"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <Eye
                        className="text-default-800 pointer-events-none"
                        size={20}
                      />
                    ) : (
                      <EyeOff
                        className="text-default-800 pointer-events-none"
                        size={20}
                      />
                    )}
                  </button>
                }
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Checkbox
                id="remember"
                isSelected={rememberMe}
                onValueChange={setRememberMe}
                size="sm"
                color="default"
                classNames={{
                  label: "text-sm text-danger font-medium",
                }}
              >
                Keep me signed in
              </Checkbox>
              <p className="text-[11px] text-default-800 ml-6">
                Recommended on trusted devices
              </p>
            </div>

            <Link
              href="/auth/forgot-password"
              className="text-sm text-danger font-medium hover:opacity-80 transition-opacity whitespace-nowrap"
            >
              Forgot Password?
            </Link>
          </div>

          <div>
            <Button
              type="submit"
              size="md"
              color="danger"
              className="w-full text-white"
              isLoading={isLoading}
              endContent={!isLoading}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
