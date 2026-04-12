"use client";

import Link from "next/link";
import { FormEvent, ReactNode } from "react";

type AuthCardProps = {
    title: string,
    subtitle: string,
    buttonText: string,
    footerText: string,
    footerLinkText: string,
    footerHref: string,
    error?: string,
    loading?: boolean,
    onSubmit: (e: FormEvent) => void;
    children: ReactNode;
}

export default function AuthCard({
    title,
    subtitle,
    buttonText,
    footerText,
    footerLinkText,
    footerHref,
    error,
    loading,
    onSubmit,
    children
}: AuthCardProps){
    return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-8 text-neutral-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Smart Task Manager
          </h1>
          <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
          </div>

          <div className="space-y-4">{children}</div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : buttonText}
          </button>

          <div className="mt-5 text-center text-sm text-neutral-400">
            {footerText}{" "}
            <Link
              href={footerHref}
              className="font-medium text-white underline underline-offset-4"
            >
              {footerLinkText}
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}