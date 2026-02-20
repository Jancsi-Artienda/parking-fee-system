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
