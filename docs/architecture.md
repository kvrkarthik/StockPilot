# Architecture

```mermaid
flowchart LR
    UI[React 19 + Redux Toolkit] -->|HTTPS / JSON| API[FastAPI REST API]
    API --> AUTH[JWT + RBAC]
    API --> SVC[Service layer]
    SVC --> REPO[Repository layer]
    REPO --> DB[(PostgreSQL)]
    API --> FILES[(Product images)]
    NGINX[NGINX] --> UI
    NGINX --> API
```

The API routes perform transport validation and authorization only. Services own transactions and business rules. Repositories encapsulate reusable persistence operations. SQLAlchemy models define database integrity; Pydantic schemas define the API contract.

