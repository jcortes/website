variable "account_id" {
  description = "Cloudflare account ID."
  type        = string
}

variable "project_name" {
  description = "Cloudflare Pages project name; the site is served on <name>.pages.dev."
  type        = string
  default     = "jcortes"
}

variable "contact_to_email" {
  description = "Inbox that receives contact-form submissions."
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend API key the contact function sends email with."
  type        = string
  sensitive   = true
}

variable "keystatic_github_client_id" {
  description = "Client ID of the GitHub App behind the online admin panel (Keystatic). Empty leaves the panel's API unconfigured."
  type        = string
  default     = ""
}

variable "keystatic_github_client_secret" {
  description = "Client secret of that GitHub App."
  type        = string
  sensitive   = true
  default     = ""
}
