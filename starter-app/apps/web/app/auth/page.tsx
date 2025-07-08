import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuthRootRedirect({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const to = `/auth/login${qs ? `?${qs}` : ""}`;
  redirect(to);
  return null;
}
