locals {
  # sslrootcert aponta para o ca.pem gerado abaixo, então a URL funciona direto no psql a partir da raiz do repositório.
  destino = "${aiven_pg.banco.service_host}:${aiven_pg.banco.service_port}/${aiven_pg_database.fomento.database_name}?sslmode=verify-full&sslrootcert=ca.pem"

  url_carga   = "postgres://${aiven_pg.banco.service_username}:${urlencode(aiven_pg.banco.service_password)}@${local.destino}"
  url_leitura = "postgres://${aiven_pg_user.leitura.username}:${urlencode(aiven_pg_user.leitura.password)}@${local.destino}"

  # O dashboard recebe o certificado na variável PG_CA, então a URL vai sem os parâmetros de SSL.
  url_leitura_dashboard = "postgres://${aiven_pg_user.leitura.username}:${urlencode(aiven_pg_user.leitura.password)}@${aiven_pg.banco.service_host}:${aiven_pg.banco.service_port}/${aiven_pg_database.fomento.database_name}"
}

# Mesmo formato do .env.example. O ETL lê esse arquivo direto.
resource "local_sensitive_file" "env" {
  count           = var.gerar_arquivos_locais ? 1 : 0
  filename        = "${path.root}/../../.env"
  file_permission = "0600"
  content         = <<-EOT
    DATABASE_URL=${local.url_carga}
    DATABASE_URL_LEITURA=${local.url_leitura}
    USUARIO_LEITURA=${aiven_pg_user.leitura.username}
  EOT
}

# Certificado da autoridade do projeto, usado para validar o servidor na conexão TLS.
# Não é segredo, mas o provider o marca como sensível, por isso o local_sensitive_file.
resource "local_sensitive_file" "ca" {
  count           = var.gerar_arquivos_locais ? 1 : 0
  filename        = "${path.root}/../../ca.pem"
  file_permission = "0644"
  content         = data.aiven_project.projeto.ca_cert
}

# Mesmas variáveis que a Vercel recebe, para rodar o dashboard localmente (npm run dev).
resource "local_sensitive_file" "env_dashboard" {
  count           = var.gerar_arquivos_locais ? 1 : 0
  filename        = "${path.root}/../../dashboard/.env.local"
  file_permission = "0600"
  # Sem heredoc: as linhas do certificado não têm recuo, e o <<- deixaria o recuo nas demais.
  content = "DATABASE_URL=${local.url_leitura_dashboard}\nPG_CA=\"${trimspace(data.aiven_project.projeto.ca_cert)}\"\n"
}
