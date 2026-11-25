terraform {
  required_version = ">= 1.7"

  required_providers {
    aiven = {
      source  = "aiven/aiven"
      version = "~> 4.65"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.27"
    }
  }
}

# O token do Aiven é lido da variável de ambiente AIVEN_TOKEN.
# Ele não aparece em nenhum arquivo do repositório.
provider "aiven" {}

# O token da Vercel é lido de VERCEL_API_TOKEN. O provider exige um token mesmo sem recursos,
# então com criar_dashboard = false vai um valor fictício que nunca chega a ser usado.
provider "vercel" {
  api_token = var.criar_dashboard ? null : "000000000000000000000000"
}
