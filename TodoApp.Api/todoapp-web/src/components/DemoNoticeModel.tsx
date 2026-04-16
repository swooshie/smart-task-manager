"use client";

import { AnimatePresence, motion } from "framer-motion";



type DemoModalProps = {
    open: boolean;
    onClose: () => void;
};

export default function DemoNoticeModal({
    open, onClose
}: DemoModalProps){
    return (
        <AnimatePresence>
        {open && (
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
            <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1],
                }}
                className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-200 shadow-2xl"
            >
                <h2 className="mb-2 text-lg font-semibold">Demo Notice</h2>

                <p className="text-neutral-400">
                This application is a portfolio project built to demonstrate full-stack and distributed systems engineering.
                </p>

                <p className="mt-2 text-neutral-400">
                It uses a Next.js frontend, a .NET backend, a Python recommendation service, MongoDB, and Redis across independent services.
                </p>

                <p className="mt-2 text-neutral-400">
                The system is deployed on free-tier infrastructure, so services may occasionally go idle and take a few seconds to respond on the first request.
                </p>

                <p className="mt-2 text-neutral-400">
                A keep-alive strategy is used to reduce cold starts, but some delay may still occur. Thank you for your patience while exploring the demo.
                </p>

                <p className="mt-2 text-neutral-400">
                The goal of this project is to highlight system design, microservice communication, resilience, and real-world deployment tradeoffs.
                </p>

                <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
                onClick={onClose}
                className="mt-5 w-full rounded-2xl bg-white py-2.5 font-medium text-black transition"
                >
                Got it
                </motion.button>
            </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
    );
}