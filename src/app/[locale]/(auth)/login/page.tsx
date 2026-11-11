import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

// The form is a client island inside a static page; it reads ?next= in the browser.
export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
