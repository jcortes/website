# Read by CI to build and deploy the site. All of these are public values:
# they end up in the served pages.

output "project_name" {
  value = cloudflare_pages_project.site.name
}

output "site_url" {
  description = "Production origin (SITE_URL for the build)."
  value       = "https://${cloudflare_pages_project.site.subdomain}"
}

output "turnstile_site_key" {
  description = "PUBLIC_TURNSTILE_SITE_KEY for the build."
  value       = cloudflare_turnstile_widget.contact.sitekey
}

output "web_analytics_token" {
  description = "PUBLIC_CF_ANALYTICS_TOKEN for the build."
  value       = cloudflare_web_analytics_site.site.site_token
}
