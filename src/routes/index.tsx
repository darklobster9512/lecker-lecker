import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="flex max-w-2xl flex-col items-center text-center">
        <div className="mb-8 flex items-center justify-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Domain wird eingerichtet
        </h1>

        <p className="mt-6 text-lg text-muted-foreground">
          Diese Webseite ist bald erreichbar. Wir richten gerade alles für dich ein.
        </p>
      </section>
    </main>
  );
}
