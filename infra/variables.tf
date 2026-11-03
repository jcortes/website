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
