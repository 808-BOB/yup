import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default function AuthRootRedirect({ searchParams }: PageProps) {
  const qs = new URLSearchParams(searchParams as Record<string, string>).toString();
  const to = `/auth/login${qs ? `?${qs}` : ""}`;
  redirect(to);
  return null;
}
