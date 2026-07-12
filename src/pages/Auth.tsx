import { useEffect } from "react";

const Auth = () => {
  useEffect(() => {
    document.title = "Anmelden";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          Wird in der nächsten Phase implementiert (Auth + Admin).
        </p>
      </div>
    </main>
  );
};

export default Auth;
