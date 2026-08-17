# BloodLink API

Express and Prisma API for the BloodLink Vite frontend. Authentication uses an HTTP-only cookie; passwords are bcrypt hashes and never returned by the API.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and a strong `JWT_SECRET`.
2. Run `npm install`, `npx prisma generate`, `npx prisma migrate dev --name init`, and `npm run prisma:seed`.
3. Run `npm run dev`.

The API is available at `http://localhost:4000/api`. Health: `GET /api/health`.

## Demo accounts

Seeded demo passwords are role-specific:

- `patient@bloodlink.demo` — `Patient@123`
- `donor@bloodlink.demo` — `Donor@123`
- `hospital@bloodlink.demo` — `Hospital@123`
- `bloodbank@bloodlink.demo` — `BloodBank@123`
- `admin@bloodlink.demo` — `Admin@123`

## Endpoint summary

| Area | Endpoints | Access |
| --- | --- | --- |
| Auth | `POST /auth/register`, `/login`, `/logout`, `/forgot-password`, `/reset-password`; `GET /auth/me` | public except logout, reset, me |
| User | `GET`, `PUT /users/me` | authenticated |
| Donors | `GET /donors`, `/donors/search`, `/donors/:id`; `PUT /donors/availability` | authenticated; availability: donor |
| Requests | `GET`, `POST /requests`; `PUT`, `DELETE /requests/:id` | authenticated; create: patient/hospital |
| Notifications | `GET /notifications`; `PUT /notifications/:id/read` | authenticated |
| Admin | `GET /admin/users`, `/admin/analytics` | admin |

Protected endpoints respond with `401` without a valid session and `403` for an insufficient role. Validation failures use `400`, missing donor records use `404`, and account-email conflicts use `409`.
