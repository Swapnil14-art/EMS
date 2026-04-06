# 🔄 Database Reset & Setup Guide

This guide helps you completely reset the database, apply migrations, and seed initial data.

---

## ⚠️ Step 1 — Clear All DB Data

Drop and recreate the database:

```bash
docker exec -it ems_db psql -U ems_user -d postgres -c "DROP DATABASE ems_db;"
docker exec -it ems_db psql -U ems_user -d postgres -c "CREATE DATABASE ems_db;"
```

## 🚀 Step 2 — Re-run Migrations
Apply all database migrations:

```bash
docker exec -it ems_backend alembic upgrade head
```

## 🌱 Step 3 — Run Seed Script
Run the seed script to populate initial data:

```bash
docker exec -it ems_backend python seed_super_admin.py
docker exec -it ems_backend python seed_all_test_data.py
```

```bash
 cd ~/EMS
docker-compose down
docker rmi ems_backend
docker-compose up -d --build
```
