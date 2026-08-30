# Enterprise Deployment Architecture

## Architecture Overview
The deployment of the application follows a modern Cloud-Native CI/CD approach suitable for Fortune-500 enterprise environments. It enforces High Availability (HA), Zero-Downtime deployments, strict network isolation, and immutable audit logging.

### Requirements:
1. **Containerization**: Application runs as an isolated, immutable Docker container.
2. **Reverse Proxy & Load Balancing**: Nginx / HAProxy / Cloud Load Balancer handling HTTPS termination, rate limiting, and WAF rules.
3. **CI/CD Pipeline**: GitHub Actions / GitLab CI for automated testing, SAST scanning, container image building, and deployment to Kubernetes (k8s) or Google Cloud Run.
4. **Database & Storage**: External managed Database (Cloud SQL / PostgreSQL) for scaling and compliance, object storage (S3 / GCS) for attachments.
5. **Monitoring**: Datadog or Prometheus/Grafana stack for performance, health checks, and logs.
6. **Disaster Recovery**: Automated nightly backups and point-in-time recovery mechanisms.

## Running Locally for Enterprise Testing
```bash
# Build the production image
docker build -t aspirantx-enterprise .

# Run locally mimicking production environments
docker-compose up -d
```

## Cloud Provider Deployment (Google Cloud Run)
1. Build and push image to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/your-project/aspirantx-enterprise
   ```
2. Deploy to Cloud Run (fully managed, auto-scaling):
   ```bash
   gcloud run deploy aspirantx-enterprise \
     --image gcr.io/your-project/aspirantx-enterprise \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3000
   ```

## Scaling and Health Checks
- The application includes `/api/admin/watchdog` and `/api/health` (if defined) for load balancers.
- RBAC validation ensures operations within the cluster are secure.
