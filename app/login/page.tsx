import { LoginPage } from "@/modules/auth/LoginPage";

type LoginRouteProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginRoute({ searchParams }: LoginRouteProps) {
  const params = await searchParams;

  return <LoginPage error={params?.error} />;
}