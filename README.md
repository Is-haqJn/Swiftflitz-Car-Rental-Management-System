# Swiftflitz - Car Rental Management System

A full-stack car rental management platform built with Laravel 12 and React 19/TypeScript.

## Features

- **Fleet management** - vehicles, categories, images, availability tracking
- **Booking & rentals** - create, confirm, pickup, return, overdue handling
- **Quote requests** - public booking form → admin quote → customer confirmation
- **Customer management** - profiles, license verification, resumable document uploads
- **Pricing engine** - base rates, optional add-ons, automatic charges, VAT, coupons, location fees
- **Payments** - deposits, security deposits, partial payments, refunds, damage settlements
- **Branches** - multi-branch support with role-scoped data visibility
- **Roles & permissions** - granular permission system (super admin, admin, manager, staff, viewer)
- **Notifications** - real-time in-app (Reverb/Echo) + email notifications with toggles per event
- **Exports** - async Excel exports for rentals, customers, vehicles, activity logs
- **Reports** - revenue, outstanding payments, vehicle expenses, maintenance, manager performance, customer analysis
- **Resumable uploads** - TUS protocol for vehicle images, customer documents, repair receipts
- **Email templates** - customisable HTML templates per notification type
- **Impersonation** - admins can log in as other users

## Tech Stack

**Backend**
- PHP 8.4 / Laravel 12
- MySQL
- Laravel Sanctum (API auth with token + cookie support)
- Laravel Reverb (WebSocket server)
- Laravel Telescope (debug dashboard)
- `spatie/laravel-medialibrary`, `spatie/laravel-settings`, `spatie/laravel-permissions`
- Spatie Query Builder & Spatie Permissions
- ankitpokhrel/tus-php (resumable uploads)
- maatwebsite/excel (Excel exports)

**Frontend**
- React 19 / TypeScript / Vite
- React 18 / TypeScript / Vite
- Tailwind CSS v4
- React Bootstrap
- TanStack Query v5
- Redux Toolkit
- React Hook Form + Zod
- Vitest (unit tests)

**Testing**
- Pest v3 (PHP feature + unit tests)

## Prerequisites

- PHP 8.4+
- Composer
- Node.js 18+
- MySQL
- [Laravel Herd](https://herd.laravel.com/) (recommended for local development)

## Running locally

### 1. Clone & Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/swiftflitz.git
cd swiftflitz

# 2. Set up the backend
cd backend
composer install
cp .env.example .env

# 3. Set up the frontend
cd ../frontend
npm install
cp .env.example .env
cd .. 
```

### 2. Configure Environment

Laravel Herd automatically creates a `.test` domain based on your project's folder name. For this project, the backend will be available at `http://backend.swiftflitz.test`.

**Backend (`backend/.env`)**

Update your database credentials. Herd provides `DB_HOST=127.0.0.1` and `DB_PORT=3306` by default.

```env
APP_URL=http://backend.swiftflitz.test

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=swiftflitz
DB_USERNAME=root
DB_PASSWORD=

# Ensure Reverb is configured to listen on all interfaces
REVERB_HOST=0.0.0.0
```

**Frontend (`frontend/.env`)**

Point the frontend to your backend's Herd URL.

```env
VITE_API_BASE_URL=http://backend.swiftflitz.test/api/v1
VITE_BASE_URL=http://backend.swiftflitz.test

# Match these with your backend's Reverb settings
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST=backend.swiftflitz.test
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

> **Note:** `VITE_REVERB_HOST` must be a hostname only, not a full URL.

### 3. Initialize the Application

From the `backend` directory, run the initial setup commands using Herd's specific PHP binary.

```bash
cd backend

# On Windows
C:\Users\danny\.config\herd\bin\php84\php.exe artisan key:generate
C:\Users\danny\.config\herd\bin\php84\php.exe artisan migrate --seed
C:\Users\danny\.config\herd\bin\php84\php.exe artisan storage:link

# On macOS
~/Library/Application\ Support/Herd/bin/php84/php artisan key:generate
~/Library/Application\ Support/Herd/bin/php84/php artisan migrate --seed
~/Library/Application\ Support/Herd/bin/php84/php artisan storage:link
```

### 4. Start the Servers

Start all services:

```bash
# From /backend - starts PHP server, queue worker, and Reverb together
composer run dev

# From /frontend - starts Vite dev server
npm run dev
```

Or start individually:

```bash
# Backend
php artisan serve
php artisan queue:work
php artisan reverb:start

# Frontend
npm run dev
```

## Available scripts

> **Important:** All `php artisan` commands must be prefixed with the full path to Herd's PHP binary, as it is not added to the system's PATH.

**Backend (`/backend`)**

| Command | Description |
|---|---|
| `composer run dev` | Start queue worker and Reverb together |
| `... artisan migrate` | Run database migrations |
| `... artisan migrate:fresh --seed` | Reset and re-seed the database |
| `... artisan test --compact` | Run the full test suite |
| `... artisan test --compact --filter=TestName` | Run a specific test |
| `... artisan reverb:start` | Start WebSocket server |
| `... artisan reset:project` | Clear caches, fresh migrate, seed, and re-link storage |
| `... vendor/bin/duster fix --dirty` | Format changed PHP files |

**Frontend (`/frontend`)**

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | Run ESLint |
| `npx prettier --write <files>` | Format specific files |

## Troubleshooting

### 504 Gateway Timeout Errors

For long-running processes, you may encounter 504 errors. This requires increasing the maximum execution time in both Nginx and PHP.

**1. Increase PHP `max_execution_time`**

- Open the **Herd UI** and go to **Settings -> PHP**.
- Find `max_execution_time` and increase it from `30` to `600` (10 minutes).
- Alternatively, edit the file directly:
  - **Windows:** `C:\Users\danny\.config\herd\bin\php84\php.ini`
  - **macOS:** `~/Library/Application Support/Herd/bin/php84/php.ini`

**2. Increase Nginx Timeout**

- Open your site-specific Nginx config file:
  - **Windows:** `C:\Users\danny\.config\herd\config\valet\Nginx\backend.swiftflitz.test.conf`
  - **macOS:** `~/Library/Application Support/Herd/config/valet/Nginx/backend.swiftflitz.test.conf`
- Add the following directives inside each `server { ... }` block:
  ```nginx
  proxy_connect_timeout 600;
  proxy_send_timeout 600;
  proxy_read_timeout 600;
  send_timeout 600;
  fastcgi_read_timeout 600;
  ```

**3. Restart Herd Services**

Restart all services from the Herd UI or by running `herd restart` in your terminal for the changes to take effect.

## Architecture

```
backend/
├── app/
│   ├── Controllers/V1/     # Thin HTTP controllers
│   ├── Services/           # Business logic (with Contracts/ interfaces)
│   ├── Repositories/       # Data access (with Contracts/ interfaces)
│   ├── DTOs/               # Data transfer objects (readonly, constructor promotion)
│   ├── Http/Requests/      # Form request validation
│   ├── Http/Resources/     # Eloquent API resources
│   ├── Policies/           # Authorization policies
│   ├── Settings/           # spatie/laravel-settings classes
│   └── Enums/              # PHP 8.1+ backed enums
├── routes/v1/api.php       # All API routes (versioned)
└── tests/Feature/          # Pest feature tests

frontend/src/
├── admin/                  # Admin panel (pages, components, routes)
├── website/                # Public-facing website
├── shared/
│   ├── api/                # Axios client + endpoint constants
│   ├── hooks/queries/      # TanStack Query hooks
│   ├── libs/               # utils.ts, validations.ts
│   ├── types/              # Shared TypeScript types
│   └── config/             # Permissions, roles, routes constants
├── services/               # API service layer
└── store/                  # Redux slices (auth)
```

## API

All API routes are prefixed with `/api/v1`.
Protected routes require a Bearer token obtained from `POST /api/v1/auth/login`.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and write/update tests
4. Run `php artisan test --compact` and `vendor/bin/duster fix --dirty`
5. Keep your branch up to date:
   ```bash
   git fetch upstream
   git rebase upstream/development
   ```
6. Push and open a Pull Request against `development`

> Always rebase on the latest `development` before pushing.

## License

Licensed under ORDAQ TECH SOLUTIONS.
