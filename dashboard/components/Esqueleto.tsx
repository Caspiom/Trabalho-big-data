// lateral = bloco da barra de filtros (só a página de comparação tem).
export function Esqueleto({ lateral = true }: { lateral?: boolean }) {
  const bloco = "animate-pulse rounded bg-line";
  return (
    <>
      {lateral && (
        <div className="space-y-3">
          <div className={`${bloco} h-8`} />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={`${bloco} h-14`} />
          ))}
        </div>
      )}
      <div role="status" aria-label="Consultando o banco" className="space-y-6">
        <div className={`${bloco} h-40`} />
        <div className={`${bloco} h-80`} />
      </div>
    </>
  );
}
