# Dashboard (pasta dashboard/) publicado na Vercel a cada push na branch principal.
resource "vercel_project" "dashboard" {
  count          = var.criar_dashboard ? 1 : 0
  name           = var.nome_projeto_vercel
  framework      = "nextjs"
  root_directory = "dashboard"
  node_version   = "24.x"

  # Washington: a região da Vercel mais próxima do banco em Nova York (do-nyc).
  resource_config = {
    function_default_regions = ["iad1"]
  }

  git_repository = {
    type              = "github"
    repo              = var.repositorio_github
    production_branch = "main"
  }
}

# O dashboard usa só o usuário de leitura. As variáveis ficam marcadas como sensíveis e não
# podem ser lidas de volta no painel da Vercel.
resource "vercel_project_environment_variable" "database_url" {
  count      = var.criar_dashboard ? 1 : 0
  project_id = vercel_project.dashboard[0].id
  key        = "DATABASE_URL"
  value      = local.url_leitura_dashboard
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "pg_ca" {
  count      = var.criar_dashboard ? 1 : 0
  project_id = vercel_project.dashboard[0].id
  key        = "PG_CA"
  value      = data.aiven_project.projeto.ca_cert
  target     = ["production", "preview"]
  sensitive  = true
}
