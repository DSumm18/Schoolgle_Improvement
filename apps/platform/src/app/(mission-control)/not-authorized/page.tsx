import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
          <ShieldX className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-zinc-100">
          Access Denied
        </h1>
        <p className="mb-6 text-zinc-400">
          You do not have permission to access Mission Control.
          <br />
          This area is restricted to authorised administrators only.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
