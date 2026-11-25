"use client";

export default function Erro({ error, retry }: { error: unknown; retry: () => void }) {
  console.error(error);
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16 sm:px-8">
      <h1 className="font-display text-3xl leading-tight">Não foi possível consultar o banco</h1>
      <p className="text-muted">
        O serviço gratuito do Aiven pode estar desligado por falta de uso ou recebendo uma nova carga. Tente de novo em
        alguns segundos.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="h-11 rounded border border-ink bg-ink px-4 text-sm font-medium text-paper hover:opacity-90"
      >
        Tentar de novo
      </button>
    </main>
  );
}
