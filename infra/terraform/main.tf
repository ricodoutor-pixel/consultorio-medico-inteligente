# 🟠 Terraform Oracle Cloud — VM ARM Always Free para Planta y Raiz
# Provisiona: 1x VM.Standard.A1.Flex (4 OCPU / 24GB RAM / 200GB SSD)
# + VCN + Internet Gateway + Subnet pública + Security List (80/443/22)
# + IP público reservado
#
# USO:
#   1. Instale Terraform: brew install terraform  (ou apt install terraform)
#   2. Crie ~/.oci/config seguindo: https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm
#   3. cd infra/terraform
#   4. Copie terraform.tfvars.example → terraform.tfvars e preencha
#   5. terraform init
#   6. terraform plan
#   7. terraform apply    ← cria tudo em ~3 minutos
#   8. terraform output public_ip   ← copia IP para apontar DNS

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.30.0"
    }
  }
}

provider "oci" {
  region = var.region
}

# ─── Variáveis ──────────────────────────────────────────────────────────────
variable "tenancy_ocid"     { type = string }
variable "compartment_ocid" { type = string }
variable "region"           { type = string  default = "sa-saopaulo-1" }
variable "ssh_public_key"   { type = string  description = "Conteúdo de ~/.ssh/id_ed25519.pub" }
variable "availability_domain_name" {
  type        = string
  description = "Ex: 'Uocm:SA-SAOPAULO-1-AD-1' — veja em Oracle Console → Identity → AD"
}

# ─── Ubuntu 22.04 ARM64 image (auto-discover) ───────────────────────────────
data "oci_core_images" "ubuntu_arm" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# ─── Rede ───────────────────────────────────────────────────────────────────
resource "oci_core_vcn" "planta_vcn" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "planta-vcn"
  dns_label      = "planta"
}

resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.planta_vcn.id
  display_name   = "planta-igw"
  enabled        = true
}

resource "oci_core_route_table" "rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.planta_vcn.id
  display_name   = "planta-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

resource "oci_core_security_list" "sl" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.planta_vcn.id
  display_name   = "planta-sl"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  # SSH
  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "6"
    tcp_options { min = 22  max = 22 }
  }
  # HTTP
  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "6"
    tcp_options { min = 80  max = 80 }
  }
  # HTTPS
  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "6"
    tcp_options { min = 443 max = 443 }
  }
}

resource "oci_core_subnet" "subnet" {
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.planta_vcn.id
  cidr_block        = "10.0.1.0/24"
  display_name      = "planta-public-subnet"
  dns_label         = "public"
  route_table_id    = oci_core_route_table.rt.id
  security_list_ids = [oci_core_security_list.sl.id]
}

# ─── VM ARM Always Free ─────────────────────────────────────────────────────
resource "oci_core_instance" "planta_vm" {
  availability_domain = var.availability_domain_name
  compartment_id      = var.compartment_ocid
  display_name        = "planta-infra-arm"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.subnet.id
    assign_public_ip = true
    hostname_label   = "planta"
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu_arm.images[0].id
    boot_volume_size_in_gbs = 100
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(<<-EOT
      #!/bin/bash
      set -e
      apt-get update -qq
      apt-get install -y git curl
      mkdir -p /opt/planta-infra
      echo "✅ VM Oracle ARM pronta — rode bootstrap.sh em seguida" > /etc/motd
    EOT
    )
  }
}

# ─── Outputs ────────────────────────────────────────────────────────────────
output "public_ip" {
  value       = oci_core_instance.planta_vm.public_ip
  description = "IP público da VM — aponte os DNS aqui"
}

output "ssh_command" {
  value = "ssh ubuntu@${oci_core_instance.planta_vm.public_ip}"
}

output "next_steps" {
  value = <<-EOT

    ✅ VM criada! Próximos passos:

    1. ssh ubuntu@${oci_core_instance.planta_vm.public_ip}
    2. sudo bash -c "curl -fsSL https://raw.githubusercontent.com/ricodoutor-pixel/consultorio-medico-inteligente/main/infra/oracle-cloud/bootstrap.sh | bash"
    3. Apontar DNS Cloudflare (proxy CINZA) para: ${oci_core_instance.planta_vm.public_ip}
       • n8n.plantayraiz.com.br      → A → ${oci_core_instance.planta_vm.public_ip}
       • api.plantayraiz.com.br      → A → ${oci_core_instance.planta_vm.public_ip}
       • assinaturas.plantayraiz.com.br → A → ${oci_core_instance.planta_vm.public_ip}
       • analytics.plantayraiz.com.br → A → ${oci_core_instance.planta_vm.public_ip}

  EOT
}
