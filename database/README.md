# Database

PostgreSQL is the production database. The canonical schema is represented by SQLAlchemy models in `backend/app/models` and versioned with Alembic in `backend/alembic/versions`.

Run migrations from `backend`:

```powershell
alembic upgrade head
```

