import {ReactNode} from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-950 to-indigo-900">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative max-w-md w-full">{children}</div>
        </div>
    )
}