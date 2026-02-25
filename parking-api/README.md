# parking-api

Minimal Express + MySQL backend for `parking-ui`.

## 1. Install

```bash
npm install
```

## 2. Configure env

Copy `.env.example` to `.env` and set your MySQL credentials:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=parkingfee
JWT_SECRET=replace_with_a_strong_secret
```

## 3. Run

```bash
npm run dev
```

## 3.1 Apply Core Table Migration

Apply the schema migration before using auth/vehicle flows:

```bash
mysql -u root -p parkingfee < sql/001_harden_core_tables.sql
```

The migration adds/enforces:
- `users.vehicle_limit`
- unique keys: `users.employee_id`, `users.username`, `users.company_email`
- `rfvehicle.ticket_num` as `AUTO_INCREMENT PRIMARY KEY`
- foreign keys from `rfvehicle.employee_id` and `temp_ticket.employee_id` to `users.employee_id`

## 4. Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /vehicles`
- `POST /vehicles`

## 5. Connect frontend

In `parking-ui/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Then run frontend normally.
