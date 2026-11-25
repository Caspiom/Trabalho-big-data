"use client";

export default function Erro({ error, retry }: { error: unknown; retry: () => void }) {
  console.error(error);
  return (
    <main className="mx-auto max-w-xl space-y-3 p-8">
      <h1 className="text-xl font-semibold">Não foi possível consultar o banco</h1>
      <p className="opacity-80">
        O serviço gratuito do Aiven pode estar desligado por falta de uso ou recebendo uma nova carga. Tente de novo em
        alguns segundos.
      </p>
      <button type="button" onClick={() => retry()} className="rounded border px-3 py-1.5">
        Tentar de novo
      </button>
    </main>
  );
}
