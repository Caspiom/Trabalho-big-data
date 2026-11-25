import Link from "next/link";

const ABAS = [
  { chave: "geral", rotulo: "Visão geral", href: "/" },
  { chave: "comparar", rotulo: "Comparar grupos", href: "/comparar" },
] as const;

export function Cabecalho({ ativo, titulo, texto }: { ativo: (typeof ABAS)[number]["chave"]; titulo: string; texto: string }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-8 sm:pt-14">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Auditoria de viés · CNPq 2019–2024 · ODS 5 e ODS 18
        </p>
        <h1 className="mt-3 max-w-3xl text-balance font-display text-4xl leading-[1.05] sm:text-5xl">{titulo}</h1>
        <p className="mt-4 max-w-2xl text-pretty text-muted">{texto}</p>
        <nav aria-label="Seções" className="-mb-px mt-8 flex gap-6">
          {ABAS.map((a) => (
            <Link
              key={a.chave}
              href={a.href}
              aria-current={a.chave === ativo ? "page" : undefined}
              className={`border-b-2 pb-3 text-sm font-medium ${
                a.chave === ativo ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {a.rotulo}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
