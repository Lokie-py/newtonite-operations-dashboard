# Newtonite — Operations Under Pressure

Newtonite is a team operations application for managing work items, team membership, comments, activity history, and approval workflows.

The project uses a React frontend, a FastAPI backend, and PostgreSQL for persistent storage.

## Features

- User authentication using JWT.
- Team and membership management.
- Work-item creation, updates, assignment, and status management.
- Work-item comments.
- Persistent activity history.
- Approval requests with reviewer authorization.
- Filtering, sorting, and pagination in the work-item interface.
- Backend tests for authentication, authorization, database behavior, work-item updates, comments, and approvals.

## Technology Stack

**Frontend**

- React
- Vite
- Tailwind CSS

**Backend**

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT authentication
- Argon2 password hashing
- pytest and HTTPX

## Project Structure

```text
NEWTONITE/
├── backend/
│   ├── app/
│   ├── tests/
│   ├── alembic/
│   ├── .env
│   └── ...
├── frontend/
│   ├── src/
│   ├── .env
│   └── ...
├── ENGINEERING_DECISIONS.md
└── README.md
```

The exact internal structure may include additional files.

## Prerequisites

Install the following before running the project:

- Python compatible with the backend dependencies.
- Node.js and npm.
- PostgreSQL.
- Git, if cloning the repository.

## Backend Setup

Open a terminal in the project root and navigate to the backend:

```powershell
cd backend
```

Create and activate a virtual environment if one does not already exist:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
python -m pip install -r requirements.txt
```

If the project does not have a `requirements.txt` file, create one from the working virtual environment using:

```powershell
python -m pip freeze > requirements.txt
```

Review the generated file before committing it.

### Configure Environment Variables

Create or update `backend/.env` using the variables expected by the backend configuration.

Typical settings include:

```dotenv
DATABASE_URL=postgresql+psycopg://<db_user>:<db_password>@localhost:5432/newtonite_db
JWT_SECRET_KEY=<a-long-random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

These are illustrative settings. Confirm the actual variable names and defaults in `backend/app/core/config.py` before running the application.

Replace the placeholders with your local PostgreSQL credentials and a securely generated secret. Never commit `.env` or real secrets to version control.

Create the `newtonite_db` database in PostgreSQL before starting the application.

### Apply Database Migrations

From the `backend` directory, with the virtual environment activated and the correct environment variables configured, run:

```powershell
alembic upgrade head
```

This applies the available Alembic migrations to the configured database.

### Start the Backend

From the `backend` directory, run:

```powershell
python -m uvicorn app.main:app --reload
```

The local API is expected at:

- API base URL: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- Health endpoint: `http://localhost:8000/health`

Keep the backend terminal running.

## Frontend Setup

Open a second terminal and navigate to the frontend:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Configure `frontend/.env` for local development:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false
```

Start the development server:

```powershell
npm run dev
```

Open the local URL printed by Vite. In the current development setup, this is expected to be `http://localhost:3000`.

The frontend must point to the running backend, and the backend must allow the frontend's development origin through CORS.

## Running Backend Tests

From the `backend` directory, activate the virtual environment and run:

```powershell
python -m pytest -v
```

The tests use a dedicated test database named `newtonite_test_db` in the current local setup.

**Important:** Configure the test database before running tests. Do not point the test configuration at a database containing data you need to preserve.

The latest recorded test run completed with 17 passing tests. Rerun the suite to verify the current checkout.

## Production Build

From the `frontend` directory, run:

```powershell
npm run build
```

Vite writes the production build to the `frontend/dist` directory.

The frontend build and backend API are separate deployment artifacts.

## Deployment Status

The application has been tested locally. Production deployment must be completed and verified before this project can be considered publicly deployed.

The intended deployment approach is:

- Frontend: AWS S3 static hosting or an appropriate static-site delivery configuration.
- Backend: FastAPI running on AWS EC2.
- Database: PostgreSQL configured for the production environment.

Before production release, configure HTTPS, production API URLs, restricted CORS origins, secure secrets, database access controls, migrations, health checks, logging, and backups.

## Known Limitations

- The current development environment uses localhost URLs.
- Production hosting and production database configuration require separate setup.
- Automated tests cover selected correctness scenarios, not every possible failure or concurrent operation.
- Performance under large workloads has not been established through load testing.

See [ENGINEERING_DECISIONS.md](ENGINEERING_DECISIONS.md) for architectural decisions, correctness considerations, trade-offs, and remaining validation work.
