# Engineering Decisions — Newtonite Operations Dashboard

## 1. Project Overview

Newtonite is an operations management application designed to help teams manage work items, assignments, comments, activity history, and approval workflows.

The system consists of a React frontend and a FastAPI backend, backed by PostgreSQL. The implementation prioritizes correctness, clear API boundaries, authorization, maintainability, and testability.

## 2. Technology Stack

## 2. Technology Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| Frontend | React, Vite | User interface and client-side interactions |
| Styling | Tailwind CSS | UI styling and layout |
| Backend | Python, FastAPI | REST API and business logic |
| ORM | SQLAlchemy | Database models and persistence |
| Database | PostgreSQL | Persistent relational data |
| Database Migrations | Alembic | Versioned database schema changes |
| Authentication | JWT | Authenticated API requests |
| Password Security | Argon2 via pwdlib | Secure password hashing |
| Testing | pytest, HTTPX | Backend and API testing |
| Frontend Build Tool | Vite | Development server and production builds |
| Deployment Target | AWS EC2, AWS S3 | Intended backend and frontend hosting |

## 3. Architecture Decisions

### 3.1 Separate Frontend and Backend

**Decision:** Keep the frontend and backend as separate applications.

**Rationale:**
- Frontend and backend responsibilities remain independent.
- API contracts provide a clear boundary between the two layers.
- Each application can be tested and deployed independently.
- The frontend can communicate with a local or deployed API through environment configuration.

**Trade-off:** Separate deployment introduces additional configuration requirements, including CORS, API URLs, authentication, and environment variables.

### 3.2 FastAPI for the Backend

**Decision:** Use FastAPI to implement REST endpoints.

**Rationale:**
- Request and response validation are supported through typed schemas.
- Interactive API documentation is available through Swagger UI.
- Routes can be organized by domain, such as teams, work items, comments, activities, and approvals.
- Dependency injection supports reusable database sessions and authentication checks.

**Trade-off:** Business rules must be implemented explicitly; the framework does not automatically provide correct authorization or transaction handling.

### 3.3 PostgreSQL with SQLAlchemy and Alembic

**Decision:** Use PostgreSQL for persistent relational data, SQLAlchemy for ORM operations, and Alembic for schema migrations.

**Rationale:**
- The application has related entities, including users, teams, memberships, work items, comments, activities, and approvals.
- Foreign keys and database constraints help maintain data integrity.
- Migrations make schema changes repeatable across environments.

**Trade-off:** PostgreSQL requires database configuration and migration management. Local development, automated testing, and production must use appropriate database configurations.

## 4. Data Integrity and Correctness

### 4.1 Database Constraints

**Decision:** Use relational constraints where appropriate, including a uniqueness constraint on team membership.

**Rationale:** A user should not have duplicate membership records for the same team. Database constraints provide a final safeguard beyond application-level validation.

**Trade-off:** Constraint violations must be handled and translated into meaningful API errors.

### 4.2 Approval Workflow

**Decision:** Represent approval requests as persistent records with a reviewer, status, and decision information.

**Rationale:**
- Approval requests can be retrieved after refreshing the application.
- Decisions are recorded rather than represented only in frontend state.
- The workflow supports pending, approved, and rejected states.

**Correctness rules implemented:**
- A reviewer must be authorized to decide the request assigned to them.
- A user cannot approve their own work item through the approval workflow.
- A decision must operate on a pending request.
- Concurrent decisions use a conditional database update so that competing requests cannot both successfully transition the same pending approval.

**Trade-off:** The UI must handle conflicts when a request has already been decided by another operation.

### 4.3 Activity History

**Decision:** Store activity records in the backend and expose activity endpoints.

**Rationale:** Important work-item changes need a persistent history that can be inspected independently of the current UI state.

The application provides endpoints for retrieving activities globally and for individual work items.

**Trade-off:** Activity recording must remain consistent with the operation it describes. The atomicity of all activity-producing operations should be verified before claiming that every change and its history entry are committed in a single transaction.

### 4.4 Comments

**Decision:** Persist comments through the backend instead of relying solely on frontend state.

**Rationale:** Comments should remain available after a page refresh and be associated with the relevant work item and author.

**Trade-off:** Comment creation requires authentication and appropriate access checks, and failures must be communicated to the user.

## 5. Authentication and Authorization

**Decision:** Use JWT-based authentication and hashed passwords.

**Rationale:**
- Authenticated API requests can identify the current user.
- Passwords are stored as hashes rather than plaintext.
- Authorization can be enforced at the API boundary.

Authorization must be based on the authenticated user's identity, team membership, role, and relationship to the requested resource, as appropriate for each operation.

The team-member management endpoint restricts adding members to authorized team administrators.

**Security considerations:**
- Production secrets must be provided through environment configuration and must not be committed to version control.
- The production environment must use HTTPS.
- Token expiry, secret management, access control, and error responses must be reviewed before production release.
- A frontend control alone is not an authorization boundary; the backend must enforce permissions.

## 6. API Design and Frontend Integration

**Decision:** Keep API calls in frontend service modules instead of embedding all request logic inside page components.

**Rationale:**
- Request logic is easier to reuse and maintain.
- Endpoint changes are easier to isolate.
- API errors can be handled consistently.
- The frontend can be configured to use the live backend.

The current local configuration uses:

- API base URL: `http://localhost:8000`
- Mock data mode: disabled

The frontend has been verified locally against the FastAPI backend, including successful API responses.

**Trade-off:** Localhost URLs cannot be used by a separately hosted production frontend. The production API URL and CORS origins must be configured before deployment.

## 7. Testing Strategy

**Decision:** Use automated backend tests with pytest and HTTPX, including a dedicated test database.

**Rationale:**
- API behavior can be checked without relying entirely on manual browser testing.
- A separate test database reduces the risk of modifying development data.
- Database setup and rollback in fixtures help isolate tests.

The latest recorded backend test run passed **17 tests**. This result applies to that run; it does not establish complete coverage of every workflow or prove production readiness.

Additional tests should cover:
- Authentication failures and permission boundaries.
- Team membership and duplicate membership handling.
- Approval authorization and concurrent decisions.
- Invalid work-item transitions and input validation.
- Activity and comment persistence.
- Pagination, filtering, and sorting.
- Database rollback and error handling.

## 8. Performance and Scalability Considerations

The application uses a relational database and a separate API layer, providing a foundation for incremental scaling.

The following measures should be verified or implemented as appropriate before production:
- Database indexes for frequently queried foreign keys and filter fields.
- Bounded pagination rather than unbounded list responses.
- Query optimization to avoid unnecessary database round trips.
- Connection-pool sizing based on deployment resources.
- Appropriate timeouts and error handling for database and external service failures.
- Monitoring of API latency, errors, and database performance.
- A production deployment strategy for database backups and recovery.

These are engineering considerations, not claims that every optimization has already been implemented or load-tested.

## 9. Deployment Decisions

The intended deployment approach is:
- **Frontend:** Static production build hosted on AWS S3, with suitable public delivery configuration.
- **Backend:** FastAPI application hosted on AWS EC2.
- **Database:** PostgreSQL configured for the target environment.

Before release, deployment configuration must include:
- Production API base URL.
- Restricted CORS origins.
- Secure environment variables and JWT secrets.
- HTTPS and appropriate network access controls.
- Database migrations.
- A production server process and restart strategy.
- Health checks, logging, and database backup arrangements.

The application has been run and tested locally. Production deployment and production-environment verification must be completed before describing it as deployed.

## 10. Known Limitations and Remaining Validation

The following items require verification before the project is considered production-ready:

1. Complete automated test coverage for authorization and approval edge cases.
2. Atomic consistency between business operations and activity records.
3. Concurrent-update behavior for work items beyond the approval decision flow.
4. Pagination limits and database query performance under larger datasets.
5. Production configuration, HTTPS, secrets, and database access restrictions.
6. Deployment health checks, logging, backups, and recovery.
7. End-to-end verification of the deployed frontend and backend.

No performance benchmark or large-scale load test is claimed in this document.

## 11. Summary

The implementation separates frontend, backend, and persistence responsibilities; uses a relational database for persistent application state; and includes authentication, team membership, activity history, comments, and approval workflows.

The engineering approach prioritizes explicit authorization, database integrity, testability, and careful handling of concurrent approval decisions. Further automated validation and production deployment checks are necessary before making broader reliability or scalability claims.