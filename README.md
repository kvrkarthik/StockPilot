# StockPilot — Smart Inventory Management System

StockPilot is a full‑stack inventory, purchasing, sales, reporting, and administration platform built as a production-oriented capstone. It combines a typed React dashboard with a layered FastAPI API, PostgreSQL, JWT authentication, granular permissions, audit logging, migrations, automated tests, and container deployment.

## Local development

Requirements: Python 3.12, Node.js 22+, PostgreSQL 17 (or use the default SQLite development database).


Backend checks:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check app
```

Frontend checks:

```powershell
cd frontend
npm test
npm run build
```

After the checks, run this command in one terminal: 
cd ..\backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload

Then in another terminal, run this command:
cd ..\frontend
npm run dev
## Main capabilities

- JWT access and rotating refresh tokens, logout, reset/change password, profiles
- Admin, Manager, Inventory Staff, Sales Staff, and Viewer roles
- Product catalog with SKU, barcode, images, suppliers, categories, stock thresholds, search, filtering, sorting, and pagination
- Stock in/out, adjustments, immutable movement history, validation, and low‑stock notifications
- Purchase orders with partial receiving and atomic stock updates
- Sales with tax, invoices, customer history, and atomic stock reduction
- Dashboard KPIs, revenue chart, top products, and recent movements
- CSV/Excel reports, settings, audit logs, responsive UI, and dark mode

## Project structure

```text
backend/   FastAPI application, migrations, and tests
frontend/  React 19 TypeScript application and component tests
database/ Database operation notes
scripts/   Windows setup and development launchers
```

See [architecture](docs/architecture.md), [ER diagram](docs/er-diagram.md), [API examples](docs/api-examples.md), and [deployment guide](docs/deployment.md).

## Security

Passwords use bcrypt. Tokens are signed, time‑limited, typed, and refresh tokens are stored as SHA‑256 digests. SQLAlchemy parameterizes queries. Pydantic validates requests. Authorization is permission-based. Mutations are audited. Upload type and size are restricted. Configure HTTPS, strong secrets, trusted origins, and backups before public deployment.

## License

MIT
