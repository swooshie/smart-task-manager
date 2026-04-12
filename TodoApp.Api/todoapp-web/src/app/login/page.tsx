"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { saveAuthData } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try{
            const result = await login({ email, password });
            saveAuthData(result.token, result.name);
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-2xl border p-6 shadow-sm space-y-4"
            >
                <h1 className="text-2xl font-semibold">Login</h1>

                <input
                className="w-full rounded-lg border p-3"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />

                <input
                className="w-full rounded-lg border p-3"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg border px-4 py-3 font-medium"
                >
                {isLoading ? "Logging in..." : "Login"}
                </button>

                <p className="text-sm">
                Don’t have an account?{" "}
                <a href="/signup" className="underline">
                    Sign up
                </a>
                </p>
            </form>
        </main>
    )
}