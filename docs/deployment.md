# Deployment guide

## Local deployment

1. Copy `.env.example` to `.env`.
2. Replace the database password, JWT secret, and initial administrator password.
3. Run `scripts/setup.ps1` to install dependencies and seed the database.
4. Run `scripts/dev.ps1` to start the backend and frontend locally.
5. Open `http://localhost:3000` to view the application.
6. Verify that the application is running by checking `http://localhost:3000` and `http://localhost:8000/docs`.

## Production deployment

- Deploy the FastAPI backend and React frontend in a host with HTTPS.
- Use environment variables defined in `.env` for secrets and database connections.
- Rotate the initial administrator password immediately after deployment.
- Configure HTTPS, strong secrets, trusted origins, and backups before making the application public.
