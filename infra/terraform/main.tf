data "aiven_project" "projeto" {
  project = var.projeto_aiven
}

resource "aiven_pg" "banco" {
  project      = data.aiven_project.projeto.project
  service_name = var.nome_servico
  cloud_name   = var.nuvem
  plan         = var.plano

  pg_user_config {
    pg_version       = var.versao_postgres
    ip_filter_string = var.ips_liberados
  }

  tag {
    key   = "projeto"
    value = "big-data-ucsal"
  }

  tag {
    key   = "etapa"
    value = "tratamento-armazenamento"
  }

  lifecycle {
    # No Free Tier o próprio Aiven pode mudar a região do serviço.
    # Sem isso o próximo plan tentaria migrar o banco de volta.
    ignore_changes = [cloud_name]
  }
}

resource "aiven_pg_database" "fomento" {
  project       = aiven_pg.banco.project
  service_name  = aiven_pg.banco.service_name
  database_name = var.nome_banco
}

# A senha é gerada pelo Aiven e fica só no state e no .env local.
resource "aiven_pg_user" "leitura" {
  project      = aiven_pg.banco.project
  service_name = aiven_pg.banco.service_name
  username     = var.usuario_leitura
}
