# EMS OCI Deployment Guide

This guide provides steps to deploy the EMS project on **Oracle Cloud Infrastructure (OCI)**.

## 1. OCI Compute Setup
- **Instance Type**: Recommended `VM.Standard.A1.Flex` (Always Free ARM) or `VM.Standard.E4.Flex`.
- **Image**: Ubuntu 22.04 or Oracle Linux 8/9.
- **Networking**:
    - Attach a **Public IP**.
    - In your **VCN Security List**, add **Ingress Rules**:
        - Port `80` (HTTP) from `0.0.0.0/0`.
        - Port `443` (HTTPS) from `0.0.0.0/0` (once you have a domain).
        - Port `22` (SSH) for access.

## 2. Server Preparation
Install Docker and Docker Compose on your VM:
```bash
# Ubuntu example
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
newgrp docker
```

## 3. Deployment Steps
1. **Clone the repository** to the VM.
2. **Configure Environment Variables**:
   - Create `ems-backend/.env` using `ems-backend/.env.example`.
   - Set `DEBUG=False`.
   - Set `STORAGE_BACKEND=oci` (if using Object Storage) and fill in OCI credentials.
   - Set `CORS_ORIGINS` to your Public IP or Domain.
3. **Build and Start**:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

## 4. OCI Object Storage (Optional but Recommended)
1. Create a **Standard Bucket** in OCI.
2. Generate an **API Key** for your OCI user.
3. Fill in the following in `ems-backend/.env`:
   - `OCI_BUCKET_NAME`
   - `OCI_NAMESPACE`
   - `OCI_REGION`
   - `STORAGE_BACKEND=oci`
4. Ensure the VM has the OCI config file at `~/.oci/config` or set up Instance Principals (advanced).

## 5. Domain & SSL Setup
Once you buy a domain:
1. Point an **A record** to your OCI Public IP.
2. Update `nginx/nginx.conf`:
   - Uncomment the SSL server block.
   - Update `server_name` to your domain.
3. Run **Certbot** (or use an OCI Load Balancer) to generate certificates and place them in `nginx/certs/`.
4. Restart Nginx: `docker-compose -f docker-compose.prod.yml restart nginx`.
