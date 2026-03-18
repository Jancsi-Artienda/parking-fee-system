# parking-ui

Frontend for a parking management system, built with React + Vite. It pairs with the Express + MySQL backend in `parking-api/`.

## Features

- Auth flows (register, login, forgot password)
- Vehicle management UI
- Parking report flows with OCR-assisted scanning

## Tech Stack

- React 19 + Vite
- React Router
- MUI + Tailwind
- Tesseract.js for OCR
- Node/Express + MySQL backend (see `parking-api/`)

## Project Structure

- `src/` React application
- `src/services/` API clients
- `src/components/` UI components
- `parking-api/` Backend API server

## Getting Started

### 1. Frontend install

```bash
npm install
```

### 2. Frontend env

Create `.env` in the project root:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Frontend run

```bash
npm run dev
```

### 4. Backend setup

From `parking-api/`:

```bash
npm install
```

Copy `parking-api/.env.example` to `parking-api/.env` and fill in MySQL credentials:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=parkingfee
JWT_SECRET=replace_with_a_strong_secret
```

Run the backend:

```bash
npm run dev
```

Optional migration (recommended before using auth/vehicle flows):

```bash
mysql -u root -p parkingfee < sql/001_harden_core_tables.sql
```

## Scripts

- `npm run dev` Start Vite dev server
- `npm run build` Production build
- `npm run preview` Preview production build
- `npm run lint` Lint the codebase

## CSRF Notes

This app uses cookie-based auth. For state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`), the frontend must include `X-CSRF-Token` and the backend verifies it against the `csrf_token` cookie. The token is issued at login, stored in session storage, and sent automatically by `src/services/api.js`.
