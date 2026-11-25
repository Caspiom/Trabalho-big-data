export function Esqueleto() {
  const bloco = "animate-pulse rounded bg-line";
  return (
    <>
      <div role="status" aria-label="Consultando o banco" className="space-y-3">
        <div className={`${bloco} h-8`} />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${bloco} h-14`} />
        ))}
      </div>
      <div className="space-y-6">
        <div className={`${bloco} h-40`} />
        <div className={`${bloco} h-80`} />
      </div>
    </>
  );
}
