# Newtonite — Operations Under Pressure

Newtonite is a team operations application designed to help teams manage work items, assignments, team membership, comments, activity history, and approval workflows through a centralized dashboard.

The application uses a React frontend, a FastAPI backend, and PostgreSQL for persistent storage. It includes JWT-based authentication, role-aware authorization, reviewer-specific approval decisions, and backend testing for core application workflows.

**Live Application:** https://d3r6tlsh4r388k.cloudfront.net/login

**API Health Check:** https://d3r6tlsh4r388k.cloudfront.net/api/health

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Database Setup and Migrations](#database-setup-and-migrations)
- [Running the Application](#running-the-application)
- [Running Backend Tests](#running-backend-tests)
- [Production Build](#production-build)
- [AWS Deployment](#aws-deployment)
- [Verified Workflows](#verified-workflows)
- [Known Limitations](#known-limitations)
- [Security Considerations](#security-considerations)
- [Engineering Decisions](#engineering-decisions)

---

## Features

### Authentication and Authorization

- JWT-based authentication.
- Password hashing using Argon2 through `pwdlib`.
- Authenticated API requests.
- Authorization checks for protected operations.
- Reviewer-specific approval decisions.
- Prevention of self-approval through the approval workflow.

### Work Item Management

- Create and update work items.
- Assign work items to users and teams.
- Manage work-item status and priority.
- View work-item details and operational information.
- Filter, sort, and paginate work items through the interface.

### Team Management

- View teams and team memberships.
- Associate users with teams.
- Manage team membership through protected backend operations.

### Operational Discussion

- Add comments to work items.
- Retrieve persisted comments.
- Associate discussion entries with their corresponding work items.

### Approval Workflow

- Create approval requests for work items.
- Assign a reviewer to an approval request.
- View pending, approved, and rejected requests.
- Restrict approval decisions to the assigned reviewer.
- Prevent the requester from deciding their own approval.
- Persist approval decisions in the backend.

### Activity History

- Record work-item creation and update events.
- Track status changes.
- Record approval-related events.
- Retrieve activity history globally and for individual work items.

---

## Technology Stack

| Layer                            | Technologies        |
| -------------------------------- | ------------------- |
| Frontend                         | React, Vite         |
| Styling                          | Tailwind CSS        |
| Backend                          | Python, FastAPI     |
| ORM                              | SQLAlchemy          |
| Database                         | PostgreSQL          |
| Database Migrations              | Alembic             |
| Authentication                   | JWT                 |
| Password Hashing                 | Argon2 via `pwdlib` |
| Backend Testing                  | pytest, HTTPX       |
| Frontend Build                   | Vite                |
| Backend Hosting                  | AWS EC2             |
| Frontend Hosting                 | AWS S3              |
| Content Delivery and API Routing | AWS CloudFront      |
| Reverse Proxy                    | Nginx               |

---

## System Architecture

Newtonite separates the user interface, API, and persistent data layer.

```text
                  User's Browser
                        |
                        v
              AWS CloudFront (HTTPS)
                        |
             +----------+-----------+
             |                      |
             v                      v
       Frontend Assets          /api/* Requests
             |                      |
             v                      v
          AWS S3                 AWS EC2
       React / Vite                 |
                                    v
                                  Nginx
                                    |
                                    v
                              FastAPI / Uvicorn
                                    |
                                    v
                                PostgreSQL
```

### Architecture Responsibilities

**Frontend — React and Vite**

- Renders the operations dashboard.
- Handles navigation, forms, filters, and user interactions.
- Communicates with the backend through API service modules.
- Uses JWT authentication for protected requests.

**Backend — FastAPI**

- Exposes REST API endpoints.
- Validates requests and responses.
- Applies authentication and authorization rules.
- Implements work-item, team, comment, activity, and approval operations.
- Interacts with PostgreSQL through SQLAlchemy.

**Database — PostgreSQL**

- Stores users, teams, memberships, work items, comments, activities, and approvals.
- Provides persistent application state.
- Supports relational constraints and transactional operations.

**AWS Infrastructure**

- S3 stores the built frontend assets.
- CloudFront delivers frontend assets over HTTPS and routes API requests.
- EC2 runs the FastAPI application.
- Nginx acts as the reverse proxy in front of the backend service.

---

## Project Structure

```text
NEWTONITE/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── alembic/
│   ├── .env.example
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── .env.example
│   ├── package.json
│   └── ...
├── ENGINEERING_DECISIONS.md
├── README.md
└── .gitignore
```

The directory tree is representative. Exact module and file names may vary with the current repository structure.

---

## Prerequisites

Install the following software before running the application locally:

- Python compatible with the backend dependencies.
- Node.js and npm.
- PostgreSQL.
- Git.

AWS CLI is needed only if you intend to manage the AWS deployment from your local machine.

---

## Local Development Setup

Clone the repository and enter the project directory:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd NEWTONITE
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the actual repository URL.

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

**Windows PowerShell**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux or macOS**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the backend dependencies:

```bash
python -m pip install -r requirements.txt
```

Configure the backend environment variables as described in the next section.

### 2. Frontend Setup

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Create the frontend environment configuration based on `frontend/.env.example`.

For local development, the frontend should point to the local backend API and use live API mode.

---

## Environment Variables

Environment variables differ between local development and production.

Create local `.env` files using the corresponding example templates. Never commit actual credentials or production secrets.

### Backend Configuration

The backend configuration uses settings such as:

```dotenv
DATABASE_URL=postgresql+psycopg://<db_user>:<db_password>@localhost:5432/newtonite_db
JWT_SECRET_KEY=<generate-a-long-random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

These values illustrate the configuration format. Confirm the required variable names and defaults in `backend/app/core/config.py` and `backend/.env.example`.

Use a securely generated JWT secret and your own local PostgreSQL credentials.

### Frontend Configuration

For local development:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false
```

For the deployed frontend, the API base URL is configured to use the production CloudFront API route:

```dotenv
VITE_API_BASE_URL=https://d3r6tlsh4r388k.cloudfront.net/api
VITE_USE_MOCK_DATA=false
```

Vite embeds `VITE_` variables into the frontend build. **Never put passwords, private keys, database credentials, or other secrets in frontend environment variables.**

---

## Database Setup and Migrations

Ensure PostgreSQL is running and that the configured database exists.

The default local database name used by this project is:

```text
newtonite_db
```

From the backend directory, with the virtual environment activated and the environment variables configured, apply the migrations:

```bash
alembic upgrade head
```

This applies the database schema migrations available in the repository.

Use a dedicated database for automated tests. Do not run tests against a database containing data that must be preserved.

---

## Running the Application

### Start the Backend

From the `backend` directory, activate the virtual environment and run:

```bash
python -m uvicorn app.main:app --reload
```

Local development endpoints:

| Endpoint       | URL                                |
| -------------- | ---------------------------------- |
| API base       | http://localhost:8000              |
| Swagger UI     | http://localhost:8000/docs         |
| OpenAPI schema | http://localhost:8000/openapi.json |

The backend must be running before the frontend can communicate with it.

### Start the Frontend

From the `frontend` directory, run:

```bash
npm run dev
```

Open the local URL printed by Vite in the terminal. The development server's port depends on the frontend configuration.

The backend must allow the local frontend origin through its CORS configuration.

---

## Running Backend Tests

The backend uses pytest and HTTPX for automated testing.

From the `backend` directory, activate the virtual environment and run:

```bash
python -m pytest -v
```

The current development setup has used a dedicated test database named `newtonite_test_db`.

Before running the suite:

1. Confirm that the test database exists and is configured correctly.
2. Verify that test fixtures use the intended test database.
3. Ensure the test configuration cannot accidentally modify the development or production database.

### Previously Recorded Test Result

The project previously recorded **17 passing backend tests** covering selected authentication, authorization, work-item, comment, approval, database, and concurrency scenarios.

This is a historical test result, not a guarantee that every test passes in the current checkout. Rerun the test suite before reporting a fresh result.

---

## Production Build

From the `frontend` directory, build the production frontend:

```bash
npm run build
```

Vite generates the static production assets in:

```text
frontend/dist/
```

Preview the production build locally, if needed, using:

```bash
npm run preview
```

The frontend build and backend application are separate deployment artifacts.

---

## AWS Deployment

Newtonite has been deployed using AWS services.

### Frontend

- **Hosting:** Amazon S3
- **Delivery:** Amazon CloudFront
- **Protocol:** HTTPS

Live application:

https://d3r6tlsh4r388k.cloudfront.net/login

### Backend

- **Hosting:** Amazon EC2
- **Application:** FastAPI served through Uvicorn
- **Reverse Proxy:** Nginx

### API Health Check

The deployed health endpoint is:

https://d3r6tlsh4r388k.cloudfront.net/api/health

The endpoint has been manually verified to return HTTP 200 with a healthy service response.

### Deployment Workflow

The frontend deployment workflow is:

1. Configure the production frontend environment variables.
2. Build the frontend using `npm run build`.
3. Upload the generated `dist/` contents to the configured S3 bucket.
4. Invalidate the relevant CloudFront cache paths.
5. Verify the live frontend and API endpoints.

The backend is deployed separately on EC2 and must be configured with the correct database URL, JWT secret, CORS settings, and runtime dependencies.

Production changes should be tested before deployment, and credentials must never be committed to source control.

---

## Verified Workflows

The following workflows have been manually tested in the deployed application:

| Workflow               | Verification                                                       |
| ---------------------- | ------------------------------------------------------------------ |
| Frontend deployment    | Loaded successfully through CloudFront                             |
| Backend health         | Returned HTTP 200                                                  |
| User login             | Successfully tested with demo accounts                             |
| Work-item creation     | Successfully created a work item                                   |
| Comment submission     | Successfully submitted a comment after correcting the endpoint URL |
| Activity history       | Loaded after signing in again                                      |
| Approval authorization | The requester was prevented from approving their own request       |
| Reviewer authorization | The assigned reviewer could approve the request                    |
| Approval persistence   | The request displayed an Approved status after the decision        |

These checks establish that the listed scenarios worked during manual testing. They do not prove that every feature, error condition, or concurrent operation has been validated.

---

## Known Limitations

The following limitations were observed during manual testing or remain to be fully validated:

- Some activity and approval records display numeric user or reviewer IDs instead of human-readable names.
- Some work-item status transitions, particularly Close and Resolved, encountered errors during earlier testing and require further verification.
- The backend test suite previously recorded 17 passing tests; the suite should be rerun against the current checkout to confirm the current result.
- Comprehensive performance and load testing has not been established.
- Production monitoring, backup and recovery procedures, and broader security validation require further review.

These limitations should be reassessed if the corresponding functionality is changed.

---

## Security Considerations

- Keep `.env` files and real credentials out of version control.
- Use a strong, unique JWT secret in production.
- Use HTTPS for the deployed application.
- Restrict database network access to authorized sources.
- Configure CORS for trusted frontend origins.
- Enforce authorization in the backend rather than relying on frontend controls.
- Store passwords as hashes, not plaintext.
- Use a dedicated test database for automated tests.
- Review logs and error responses to avoid exposing secrets.
- Maintain database backups and validate the recovery process before relying on production data.

---

## Engineering Decisions

The main architectural decisions, trade-offs, data-integrity considerations, authentication design, testing strategy, and remaining validation work are documented in:

[`ENGINEERING_DECISIONS.md`](ENGINEERING_DECISIONS.md)

---

## Project Status

Newtonite is deployed on AWS, and the main manually tested workflows include login, work-item creation, comment submission, activity history, and reviewer-authorized approval.

The application remains subject to the known limitations and further validation described above. The project should not be considered fully production-hardened until its outstanding functional, security, monitoring, and recovery checks have been addressed.
