## Next.js 14 frontend bootstrap

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Adjust API URL if needed.

### 3. Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

### Auth flow

- Login page: `/auth/login`
- Role redirects:
  - Receptionist -> `/reception/dashboard`
  - Employee -> `/employee/dashboard`
- Token is stored in `localStorage` and attached as `Authorization: Bearer <token>`.

### Mock-first toggle

In `app/auth/login/page.tsx`:

```ts
const USE_MOCK_LOGIN = false;
```

Set to `true` for static UI testing before backend integration.
