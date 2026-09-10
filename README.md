# Project setup

## Backend

1. Change directory to backend

   ```bash
   cd backend
   ```

2. Sync requirements

   ```bash
   uv sync
   ```

3. Create backend `.env` file and these data

   ```env
   SECRET_KEY = <secret_key>
   GEMINI_API_KEY = <gemini-api-key>
   JWT_SECRET_KEY = <Jwt_secret>
   ```

4. Create keys using this

   ```sh
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

## Frontend

1. Change directory to frontend

   ```sh
   cd frontend
   ```

2. Install npm packages

   ```sh
   npm ci
   ```

3. Run frontend

   ```sh
   npm run dev
   npm run host
   ```
