"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { saveAuthData } from "@/lib/auth";
import AuthCard from "@/components/AuthCard";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
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
        <AuthCard
        title="Login"
        subtitle="Stay organized with tasks, suggestions, and reminders."
        buttonText="Login"
        footerText="Don’t have an account?"
        footerLinkText="Sign up"
        footerHref="/signup"
        error={error}
        loading={isLoading}
        onSubmit={handleSubmit}
        >
        <div>
            <label className="mb-2 block text-sm text-neutral-300">Email</label>
            <input
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-white outline-none placeholder:text-neutral-500"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />
        </div>

        <div>
            <label className="mb-2 block text-sm text-neutral-300">Password</label>
            <input
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-white outline-none placeholder:text-neutral-500"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
        </div>
        </AuthCard>
    );
    
}