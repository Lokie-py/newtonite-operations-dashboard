# Engineering Decisions — Newtonite Operations Dashboard

## 1. Project Overview

Newtonite — Operations Under Pressure is a team operations application designed to centralize work-item management, team membership, assignments, comments, activity history, and approval workflows.

The application consists of a React frontend, a FastAPI backend, and a PostgreSQL database. It uses JWT-based authentication, password hashing, API-level authorization, relational data modeling, and automated backend tests.

The project prioritizes:

- Separation of frontend and backend responsibilities.
- Explicit authentication and authorization.
- Persistent application state.
- Database integrity and transactional correctness.
- Auditable operational changes.
- Maintainable API and service boundaries.
- Testing of important business rules and concurrent operations.
- Practical deployment using AWS infrastructure.

The application is deployed on AWS. Some functional and operational limitations remain and are documented in this file.

### Production URLs

- **Application:** https://d3r6tlsh4r388k.cloudfront.net/login
- **API health check:** https://d3r6tlsh4r388k.cloudfront.net/api/health

The production health endpoint was manually verified to return HTTP 200 with a healthy service response.

---

## 2. Technology Stack

| Layer                | Technology          | Engineering Purpose                      |
| -------------------- | ------------------- | ---------------------------------------- |
| Frontend             | React               | Component-based user interface           |
| Frontend build       | Vite                | Development server and production builds |
| Styling              | Tailwind CSS        | Consistent interface styling             |
| Backend              | Python, FastAPI     | REST API and application logic           |
| ORM                  | SQLAlchemy          | Database access and relational modeling  |
| Database             | PostgreSQL          | Persistent relational storage            |
| Migrations           | Alembic             | Version-controlled schema changes        |
| Authentication       | JWT                 | Authenticated API requests               |
| Password security    | Argon2 via `pwdlib` | Password hashing and verification        |
| Backend testing      | pytest, HTTPX       | Automated API and backend tests          |
| Static asset storage | Amazon S3           | Production frontend assets               |
| Content delivery     | Amazon CloudFront   | HTTPS delivery and API routing           |
| Backend hosting      | Amazon EC2          | Backend application runtime              |
| Reverse proxy        | Nginx               | Routing requests to the backend service  |

The selected technologies support a clear separation of responsibilities and allow the frontend, backend, and database to be configured independently.

---

## 3. Architecture Decisions

### 3.1 Separate Frontend and Backend

**Decision:** Maintain the frontend and backend as separate applications communicating through HTTP APIs.

**Rationale:**

- The frontend handles presentation, navigation, and user interaction.
- The backend owns business rules, authentication, authorization, and persistence.
- API service modules provide a consistent boundary between the applications.
- Frontend and backend can be built, tested, and deployed independently.
- Environment configuration allows the frontend to target either a local API or the deployed API.

**Trade-offs:**

- Separate applications require explicit API URL configuration.
- CORS must be configured correctly.
- Authentication tokens must be transmitted and handled securely.
- API errors and network failures must be handled by the frontend.

### 3.2 FastAPI for the Backend

**Decision:** Use FastAPI to expose REST endpoints and implement backend operations.

**Rationale:**

- Typed request and response schemas support validation.
- Dependency injection supports reusable database sessions and authentication dependencies.
- Interactive API documentation is available through Swagger UI.
- Routes can be organized around application domains, including teams, work items, comments, activities, and approvals.
- HTTP status codes provide a structured way to communicate successful operations and failures.

**Trade-offs:**

FastAPI does not automatically enforce application-specific authorization, data integrity, or transaction boundaries. These rules must be implemented and tested explicitly.

### 3.3 PostgreSQL, SQLAlchemy, and Alembic

**Decision:** Use PostgreSQL as the persistent database, SQLAlchemy for ORM operations, and Alembic for schema migrations.

**Rationale:**

Newtonite contains related entities such as users, teams, team memberships, work items, comments, activities, and approvals. A relational database supports relationships, foreign keys, uniqueness constraints, and transactional operations across these entities.

SQLAlchemy centralizes database interaction through models and sessions. Alembic provides a repeatable way to apply schema changes across environments.

**Trade-offs:**

- Database credentials and connectivity must be configured correctly.
- Schema changes must be managed through migrations.
- Test and production databases must remain isolated.
- Query performance depends on appropriate indexes, query design, and pagination.

### 3.4 AWS Deployment Architecture

**Decision:** Deploy the frontend and backend separately using AWS services.

**Implemented architecture:**

- Amazon S3 stores the built frontend assets.
- Amazon CloudFront delivers the frontend over HTTPS.
- CloudFront routes `/api/*` requests to the backend origin.
- Amazon EC2 runs the FastAPI application.
- Nginx acts as the reverse proxy in front of the backend service.
- PostgreSQL provides persistent storage for application data.

**Rationale:**

- Static frontend assets do not need to run on the backend server.
- The backend can be maintained independently of frontend builds.
- CloudFront provides a common HTTPS entry point for the application and API.
- Nginx provides a controlled reverse-proxy layer for the backend.

**Trade-offs and operational considerations:**

- CloudFront behavior configuration and API routing must match the backend routes.
- Frontend builds must contain the correct production API URL.
- Cache invalidation may be necessary after frontend deployments.
- EC2, Nginx, the backend service, and database connectivity must be monitored.
- Production availability depends on the correct configuration and health of these components.

The deployed health endpoint has been verified. This does not by itself establish complete production resilience or availability.

---

## 4. Data Integrity and Correctness

### 4.1 Relational Constraints and Team Membership

**Decision:** Represent team membership as persistent relational data and use database constraints where appropriate.

**Rationale:**

- Membership records determine relationships between users and teams.
- Duplicate membership records for the same user and team should be prevented.
- Database constraints provide protection beyond application-level validation.
- Foreign keys help prevent invalid references between related records.

**Trade-off:**

Constraint violations must be handled appropriately so that the API returns meaningful errors rather than exposing raw database exceptions.

### 4.2 Database Sessions and Transactions

**Decision:** Use SQLAlchemy sessions for database operations and transactions for changes that require consistent persistence.

**Rationale:**

- Database sessions provide a consistent interface for reading and writing records.
- Transactions allow related changes to be committed or rolled back together when implemented within the same transaction boundary.
- A dedicated test database helps isolate automated tests from development and production data.

**Remaining validation:**

The atomic consistency of all business operations and their corresponding activity records must not be assumed. Each operation should be checked to confirm whether its data changes and history entries are committed or rolled back together.

### 4.3 Work-Item Management

**Decision:** Store work items in the database and expose backend endpoints for creation, retrieval, updates, assignment, and status management.

**Rationale:**

- Work items must remain available across browser sessions.
- Assignments and team relationships need to be persisted.
- Updates should be validated by the backend rather than trusted solely to frontend controls.
- Work-item details can be retrieved independently of the dashboard's client-side state.

**Trade-offs:**

Status transitions and concurrent updates require explicit business rules. Some status transitions, particularly Close and Resolved, encountered errors during manual testing and require further investigation.

The existence of a status field does not imply that every transition has been fully validated.

### 4.4 Comments

**Decision:** Persist operational discussion through backend endpoints instead of relying solely on frontend state.

**Rationale:**

- Comments remain available after a page refresh.
- Comments can be associated with the relevant work item and author.
- The backend can enforce authentication and resource-access rules.

**Implementation detail:**

The comment endpoints use trailing-slash routes. The frontend endpoint configuration was corrected to match the backend route format after a redirect issue was identified during production testing.

Comment submission was subsequently verified manually.

**Trade-offs:**

Comment creation and retrieval depend on correct API routing, authentication, authorization, and error handling. Future route changes must be reflected in the frontend service configuration.

### 4.5 Activity History

**Decision:** Store activity records in the backend and expose endpoints for retrieving global and work-item-specific history.

**Rationale:**

- Important operational changes should remain inspectable after refreshing the application.
- Status changes and approval-related events provide context beyond the current work-item state.
- A persistent history supports auditing and troubleshooting.

**Observed behavior:**

The deployed activity history successfully displayed work-item creation, approval-related events, and status changes after the user signed in again.

**Trade-offs and limitations:**

- Activity records must be associated with the correct actor and affected resource.
- The UI currently displays numeric user IDs in some activity records instead of human-readable names.
- Atomic consistency between business changes and history records requires additional verification.
- A visible history entry is not a substitute for a complete audit-security review.

### 4.6 Filtering, Sorting, and Pagination

**Decision:** Provide filtering, sorting, and pagination in the work-item interface.

**Rationale:**

- Users need to locate relevant work items without manually reviewing every record.
- Pagination can limit the amount of data returned and rendered at once.
- Structured filtering improves the usability of the operations dashboard.

**Trade-offs:**

Filtering and sorting parameters must be validated by the backend where applicable. Pagination limits, query efficiency, and behavior on large datasets require additional testing before making scalability claims.

---

## 5. Approval Workflow and Concurrency

### 5.1 Persistent Approval Records

**Decision:** Represent approval requests as database records with a requester, assigned reviewer, status, and associated work item.

**Rationale:**

- Approval requests remain available after refreshing the application.
- Approval status is maintained by the backend rather than only in frontend state.
- Pending, approved, and rejected states can be queried independently.
- Approval-related activity can be recorded and displayed.

### 5.2 Reviewer Authorization

**Decision:** Restrict approval decisions to the reviewer assigned to the request and prevent the requester from deciding their own approval.

**Rationale:**

- Approval decisions should be made by the designated reviewer.
- The requesting user should not be able to approve their own request.
- Authorization must be enforced by the backend rather than by hiding or displaying frontend buttons alone.

**Observed behavior:**

During production testing, the requester was prevented from deciding their own approval. The assigned reviewer could access the decision workflow, and an approval was successfully completed.

The absence of an Approve button for an unauthorized user is an intentional authorization outcome, not necessarily a UI defect.

### 5.3 Approval State Transitions

**Decision:** Allow approval decisions only for requests that are still pending.

**Rationale:**

A previously approved or rejected request should not be treated as a new pending decision. The backend must check the current state before accepting a decision.

### 5.4 Concurrent Approval Decisions

**Decision:** Use a conditional database update for approval decisions so that competing requests cannot both successfully transition the same pending approval.

**Rationale:**

Without a suitable concurrency safeguard, two requests could both read the same pending state and attempt to finalize the approval.

A conditional update ensures that only an operation that matches the expected pending state can successfully perform that transition.

**Trade-off:**

The frontend must handle cases in which another operation has already decided the request. The client should refresh or display a useful conflict message rather than assuming every decision will succeed.

The previously recorded backend test suite included concurrency coverage. The current suite should be rerun to confirm that the behavior remains valid.

---

## 6. Authentication and Authorization

### 6.1 JWT Authentication

**Decision:** Use JWT-based authentication for protected API requests.

**Rationale:**

- The backend can identify the authenticated user from the validated token.
- API endpoints can enforce authentication without relying on frontend identity claims.
- The frontend can attach the token to authenticated requests.

**Trade-offs:**

- Token expiry and invalid tokens must be handled correctly.
- The frontend must respond appropriately when a session expires.
- Token storage and transmission require security consideration.
- JWT authentication alone does not establish whether a user is authorized to access a particular resource.

### 6.2 Password Hashing

**Decision:** Hash passwords using Argon2 through `pwdlib`.

**Rationale:**

Passwords should not be stored in plaintext. Password hashing makes the stored representation unsuitable for direct recovery of the original password under normal use.

**Trade-off:**

Password verification and account creation must consistently use the same hashing and verification implementation.

### 6.3 Resource-Level Authorization

**Decision:** Enforce permissions at the backend API boundary.

Authorization decisions should consider the authenticated identity, the requested operation, and the user's relationship to the relevant resource, such as team membership or assigned reviewer status.

The frontend may improve usability by hiding unavailable actions, but the backend remains responsible for rejecting unauthorized requests.

### 6.4 Secrets and Environment Configuration

**Decision:** Keep environment-specific configuration outside committed source code.

**Rationale:**

Database credentials, JWT secrets, and other sensitive values should not be embedded in application source files or public repository documentation.

Example environment files should contain placeholders only. Production secrets must be configured separately.

**Remaining security work:**

Token handling, secret rotation, account lifecycle management, access controls, error responses, and broader security testing require review before claiming production hardening.

---

## 7. API Design and Frontend Integration

### 7.1 Centralized API Service Modules

**Decision:** Keep API request logic in frontend service modules rather than embedding all network calls directly in page components.

**Rationale:**

- Request logic can be reused across components.
- Endpoint changes can be isolated.
- Authentication headers and error handling can be managed consistently.
- API service modules provide a clearer separation between presentation and data access.

### 7.2 Environment-Based API Configuration

**Decision:** Configure the API base URL through frontend environment variables.

Local development uses:

`http://localhost:8000`

The deployed application uses:

`https://d3r6tlsh4r388k.cloudfront.net/api`

**Rationale:**

The same frontend source can be built for local development or production without hardcoding the backend host into individual components.

**Trade-offs:**

- Environment variables must be correct before building.
- Vite's `VITE_` variables are embedded in client-side assets and must never contain secrets.
- Production builds must be rebuilt after changing build-time environment configuration.

### 7.3 Error Handling and API Routing

**Decision:** Use HTTP responses and frontend error handling to communicate failures.

**Observed issue and correction:**

The comment endpoint initially omitted a trailing slash in the frontend configuration, while the backend route expected one. This produced a redirect during comment submission. The frontend endpoint was updated, the production build was rebuilt, and the updated assets were deployed through S3 and CloudFront.

The health endpoint, activity history, and comment submission were subsequently tested manually.

**Trade-off:**

Generic frontend error messages can obscure the difference between an authentication failure, a route mismatch, a server error, and a network problem. Future improvements should preserve useful diagnostic information without exposing sensitive details.

---

## 8. Testing Strategy

### 8.1 Automated Backend Testing

**Decision:** Use pytest and HTTPX to test backend behavior, with a dedicated test database.

**Rationale:**

- API behavior can be checked independently of manual browser interaction.
- Test fixtures can isolate data between tests.
- Authentication and authorization rules can be verified systematically.
- Database operations can be tested against controlled test data.
- Concurrency-related behavior can be examined through automated tests.

### 8.2 Previously Recorded Test Result

The project previously recorded **17 passing backend tests** covering selected authentication, work-item, comment, approval, activity, database, and concurrency scenarios.

This result describes the earlier recorded run. It should not be represented as a fresh test result unless the suite is rerun against the current checkout.

To run the suite from the backend directory:

```bash
python -m pytest -v
```

Before running tests, verify that the test database is configured correctly and that the test setup cannot accidentally modify production data.

### 8.3 Manual Production Verification

The following behaviors were manually verified in the deployed application:

- Frontend loaded through CloudFront.
- API health endpoint returned HTTP 200.
- Demo-user login worked.
- Work-item creation succeeded.
- Comment submission succeeded after the endpoint correction.
- Activity history loaded after authentication was restored.
- A requester could not decide their own approval.
- An assigned reviewer successfully completed an approval.

These are scenario-specific checks, not proof that all workflows and edge cases are correct.

### 8.4 Additional Testing Priorities

Further testing should cover:

- Invalid, expired, and missing authentication tokens.
- Unauthorized access to team and work-item resources.
- Duplicate team membership and database constraint violations.
- Invalid work-item status transitions.
- Concurrent work-item updates.
- Approval decisions made concurrently.
- Activity and business-operation transaction consistency.
- Comment validation and resource access.
- Filtering, sorting, and pagination edge cases.
- Error handling, database rollback, and recovery behavior.

---

## 9. Performance and Scalability Considerations

**Decision:** Use a separate API layer and a relational database as the foundation for incremental scaling.

This architecture provides a reasonable foundation for a team operations application, but architecture alone does not establish production scalability.

The following areas require evaluation as usage increases:

- Indexes for frequently queried foreign keys and filter fields.
- Bounded pagination for list endpoints.
- Query efficiency and avoidance of unnecessary database round trips.
- Database connection-pool configuration.
- Request timeouts and failure handling.
- API latency and error monitoring.
- Database backup and recovery procedures.
- Resource utilization on EC2.

No large-scale load-test result or performance benchmark is claimed in this document.

---

## 10. Deployment Decisions and Operations

### 10.1 Frontend Deployment

**Decision:** Build the frontend into static assets, store those assets in S3, and deliver them through CloudFront.

**Rationale:**

- Static assets do not require a continuously running frontend application server.
- Frontend builds can be deployed independently of backend changes.
- CloudFront provides an HTTPS entry point for the application.

**Operational considerations:**

- The correct production API URL must be embedded in the build.
- Updated assets must be uploaded to the intended S3 bucket.
- CloudFront cache invalidation may be required after a deployment.
- A successful upload does not by itself prove that the latest frontend is being served.

### 10.2 Backend Deployment

**Decision:** Run the FastAPI backend on EC2, with Nginx forwarding requests to the backend service.

**Rationale:**

- The backend can run as a managed operating-system service.
- Nginx provides a reverse-proxy boundary.
- The application can be restarted and inspected independently of the frontend.

**Operational considerations:**

- The backend service must remain healthy.
- Nginx routing must match the API paths exposed through CloudFront.
- Database connectivity and production environment variables must be valid.
- Logs and health checks should be reviewed when troubleshooting failures.

### 10.3 Production Verification

The deployed frontend and backend have been manually verified for selected workflows. The API health endpoint has returned a healthy response.

However, production hardening remains distinct from successful deployment. Monitoring, backup restoration, recovery testing, performance testing, and comprehensive security validation require further work.

---

## 11. Known Limitations and Remaining Work

The following limitations were observed or remain to be fully validated:

1. **User display names:** Some activity and approval records display numeric user or reviewer IDs rather than human-readable names.

2. **Status transitions:** Close and Resolved status transitions encountered errors during earlier manual testing and require further investigation.

3. **Automated test confirmation:** The previous 17-test result must be reconfirmed against the current repository state.

4. **Activity consistency:** The atomic relationship between every business operation and its corresponding activity record needs further verification.

5. **Concurrent work-item updates:** Concurrency protection outside the approval decision flow requires further evaluation.

6. **Performance:** No comprehensive load-testing results are available.

7. **Operational resilience:** Production monitoring, backup restoration, and recovery procedures need further validation.

8. **Security hardening:** A comprehensive review of authentication, authorization, secret management, and deployment security remains necessary.

These limitations should be updated when fixes are implemented and verified.

---

## 12. Summary

Newtonite uses a separated React frontend, FastAPI backend, and PostgreSQL persistence layer, deployed through AWS S3, CloudFront, EC2, and Nginx.

The principal engineering decisions emphasize:

- Separation of responsibilities.
- Explicit backend authentication and authorization.
- Password hashing and environment-based secrets.
- Relational data integrity.
- Persistent work-item, comment, activity, and approval records.
- Reviewer-specific approval decisions.
- Conditional database updates for concurrent approval decisions.
- Centralized frontend API integration.
- Automated backend testing and manual production verification.

The application is deployed and selected workflows have been tested. Its previously recorded 17-test backend result, observed limitations, and outstanding operational checks are documented without claiming unverified reliability, scalability, or complete production readiness.
