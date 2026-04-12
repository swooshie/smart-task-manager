"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/api";
import { saveAuthData } from "@/lib/auth";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try{
            const result = await signup({ name, email, password });
            saveAuthData(result.token, result.name);
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Signup failed");
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
                <h1 className="text-2xl font-semibold">Sign up</h1>

                <input
                className="w-full rounded-lg border p-3"
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />

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
                {isLoading ? "Creating account..." : "Create account"}
                </button>

                <p className="text-sm">
                Already have an account?{" "}
                <a href="/login" className="underline">
                    Login
                </a>
                </p>
            </form>
        </main>
    )
}