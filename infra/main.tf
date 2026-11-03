locals {
  # Cloudflare assigns <name>.pages.dev unless that name is already taken.
  hostname = "${var.project_name}.pages.dev"

  # Shared by production and preview deployments: previews run the real
  # contact flow (Turnstile and Resend, to the owner's inbox only).
  function_config = {
    compatibility_date = "2026-11-01"

    env_vars = {
      CONTACT_TO_EMAIL = {
        type  = "secret_text"
        value = var.contact_to_email
      }
      RESEND_API_KEY = {
        type  = "secret_text"
        value = var.resend_api_key
      }
      TURNSTILE_SECRET_KEY = {
        type  = "secret_text"
        value = cloudflare_turnstile_widget.contact.secret
      }
    }

    # Conversion events written by functions/api/event.ts.
    analytics_engine_datasets = {
      EVENTS = {
        dataset = "website_events"
      }
    }
  }
}

# Direct-upload project: CI builds the site and deploys it with Wrangler.
resource "cloudflare_pages_project" "site" {
  account_id        = var.account_id
  name              = var.project_name
  production_branch = "main"

  deployment_configs = {
    production = local.function_config
    preview    = local.function_config
  }

  lifecycle {
    # The Turnstile widget is bound to this hostname (it can't reference the
    # computed subdomain: the project already depends on the widget's secret).
    postcondition {
      condition     = self.subdomain == local.hostname
      error_message = "The project got ${self.subdomain}, not ${local.hostname}: pick another project_name."
    }
  }
}

# Spam protection for the contact form. A hostname also covers its
# subdomains, so preview deployments (<hash>.<project>.pages.dev) work too.
# Its secret feeds the project's bindings, so it's created first.
resource "cloudflare_turnstile_widget" "contact" {
  account_id = var.account_id
  name       = "${var.project_name} contact form"
  domains    = [local.hostname]
  mode       = "managed"
  region     = "world"
}

# Cookie-free page views. A pages.dev host isn't a zone on this account, so
# the beacon is embedded by the build (src/layouts/BaseLayout.astro) instead
# of being auto-installed.
resource "cloudflare_web_analytics_site" "site" {
  account_id   = var.account_id
  host         = cloudflare_pages_project.site.subdomain
  auto_install = false
}
