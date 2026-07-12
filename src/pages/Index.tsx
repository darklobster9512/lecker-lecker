import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Domain";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-slate-700">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Diese Domain wird gerade eingerichtet.</h1>
        <p className="mt-2 text-sm text-slate-500">Bitte versuchen Sie es später erneut.</p>
      </div>
    </main>
  );
};

export default Index;
