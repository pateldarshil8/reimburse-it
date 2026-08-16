import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { unreadNotificationCount } from "@/lib/notifications";

const NAV_LINKS: Record<string, { href: string; label: string }> = {
  employee: { href: "/employee", label: "My requests" },
  reviewer: { href: "/reviewer", label: "Review queue" },
  admin: { href: "/admin", label: "Admin" },
};

export async function SiteNav() {
  const session = await auth();
  const role = session?.user?.role;
  const link = role ? NAV_LINKS[role] : undefined;
  const unreadCount = session?.user
    ? await unreadNotificationCount(session.user.id)
    : 0;

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-neutral-900 transition-colors hover:text-indigo-600"
          >
            <span className="inline-block size-2 rounded-full bg-indigo-600" aria-hidden="true" />
            ReimburseIt
          </Link>
          {link && (
            <nav className="flex items-center gap-4 text-sm text-neutral-600">
              <Link href={link.href} className="transition-colors hover:text-indigo-600">
                {link.label}
              </Link>
            </nav>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {session?.user && (
            <>
              <Link
                href="/notifications"
                className="relative text-sm text-neutral-600 transition-colors hover:text-indigo-600"
              >
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
              <Badge variant="secondary">{session.user.role}</Badge>
              <span className="hidden text-sm text-neutral-600 sm:inline">
                {session.user.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
