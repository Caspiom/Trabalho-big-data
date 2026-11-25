export function Indicador({ numero, titulo, nota, children }: { numero?: number; titulo: string; nota: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 space-y-4">
      <div className="border-t border-ink pt-3">
        <h2 className="font-display text-2xl leading-tight">
          {numero !== undefined && <span className="mr-2 text-muted tabular-nums">{numero}.</span>}
          {titulo}
        </h2>
        <p className="mt-1 max-w-3xl text-pretty text-sm text-muted">{nota}</p>
      </div>
      {children}
    </section>
  );
}
