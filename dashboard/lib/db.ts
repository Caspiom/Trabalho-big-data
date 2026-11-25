import postgres from "postgres";

let conexao: postgres.Sql | undefined;

// Criada no primeiro uso, para o build não exigir as variáveis do banco.
export function banco() {
  if (!conexao) {
    const url = process.env.DATABASE_URL;
    const ca = process.env.PG_CA;
    if (!url || !ca) throw new Error("Defina DATABASE_URL e PG_CA (ver dashboard/.env.example)");
    conexao = postgres(url, {
      // Confere a cadeia do certificado e o nome do servidor, como o carregar.py.
      ssl: { ca, rejectUnauthorized: true },
      // ponytail: 1 conexão por instância serverless; o plano gratuito do Aiven aceita 20 no total.
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return conexao;
}
