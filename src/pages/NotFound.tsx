import { Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  useEffect(() => {
    document.title = "404 – Seite nicht gefunden";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b10] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-white">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-white">Seite nicht gefunden</h2>
        <p className="mt-2 text-sm text-gray-400">
          Die aufgerufene Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-black hover:bg-[#a78bfa] hover:text-white"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
