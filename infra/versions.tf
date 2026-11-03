terraform {
  required_version = ">= 1.10"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # State lives in a private Cloudflare R2 bucket, through R2's S3-compatible
  # API (docs/adr/0002-opentofu-state-in-cloudflare-r2.md). The endpoint
  # (https://<account id>.r2.cloudflarestorage.com) comes from
  # AWS_ENDPOINT_URL_S3, and the credentials from AWS_ACCESS_KEY_ID and
  # AWS_SECRET_ACCESS_KEY (an R2 API token), so nothing account-specific is
  # committed. CI runs applies one at a time, so no state locking is
  # configured (see the ADR before running OpenTofu locally).
  backend "s3" {
    bucket = "website-tofu-state"
    key    = "website/terraform.tfstate"
    region = "auto"

    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}

# Authenticates with CLOUDFLARE_API_TOKEN from the environment.
provider "cloudflare" {}
