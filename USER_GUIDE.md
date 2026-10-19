# User Guide — Newtonite Operations Dashboard

## 1. Application Access

**Live application:** https://d3r6tlsh4r388k.cloudfront.net/login

Open the URL in a modern web browser. The application provides a dashboard for managing work items, team membership, comments, activity history, and approval workflows.

The frontend is hosted on AWS S3 and delivered through CloudFront. The FastAPI backend runs on AWS EC2, with PostgreSQL running on the same EC2 instance.

## 2. Demo Login

The application includes demo accounts for evaluating different workflows.

| Demo user     | Email                                                 |
| ------------- | ----------------------------------------------------- |
| Sarah Jenkins | `sarah.jenkins@newtonite.internal`                    |
| Alex Rivera   | `alex.rivera@newtonite.internal`                      |
| Alex Morgan   | `alex.morgan@newtonite.internal`                      |
| David Chen    | `david.chen@newtonite.internal`                       |
| Elena Rostova | Use the account listed in the application's demo data |
| Marcus Brody  | Use the account listed in the application's demo data |

Use the demo credentials provided separately for evaluation. Do not use production secrets or personal credentials.

### Known login issue: Sarah Jenkins

The Sarah Jenkins quick-login shortcut may fail because the shortcut's credentials do not match the account's current password.

If this happens:

1. Return to the login screen.
2. Enter Sarah Jenkins's email manually.
3. Enter the currently valid password supplied for that demo account.
4. If login still fails, use another verified demo account to evaluate the application.

This is a known demo-login configuration issue and does not, by itself, indicate that the entire authentication system is unavailable.

If login fails for multiple accounts, verify the credentials and check the application's backend health endpoint before retrying.

## 3. Dashboard Overview

After signing in, explore the dashboard to review the application's operational information.

The main areas include:

- **Dashboard:** Overview of work and operational activity.
- **Work Items:** Create, view, assign, and update tasks.
- **Teams:** View teams and team membership.
- **Activity History:** Review recorded application actions.
- **Approvals:** Review pending requests and make authorized decisions.

The information and actions available depend on the signed-in user's permissions and the current application data.

## 4. Working with Work Items

Work items represent tasks that need to be tracked and managed.

### Create a work item

1. Open the Work Items section.
2. Select the create or add-work-item action.
3. Enter the required details, such as the title and description.
4. Set the relevant priority and assignment fields if available.
5. Submit the form.
6. Confirm that the new item appears in the work-item list.

### View and update work items

1. Open a work item from the list.
2. Review its details, current status, priority, and assignment.
3. Use the available actions to update the permitted fields.
4. Save the changes and verify the updated values.

### Add a comment

1. Open the relevant work item.
2. Locate its comments section.
3. Enter a comment and submit it.
4. Confirm that the comment appears in the item's discussion.

### Work-item concurrency

The backend includes version-based checks for work-item updates. If an update is based on stale data, it may be rejected rather than silently overwriting a newer change.

## 5. Teams and Membership

The Teams section lets users inspect team information and membership.

1. Open Teams.
2. Select a team to view its details and members.
3. Review the available membership and role information.
4. Use membership or role-management actions only when your account is authorized to do so.

Team membership is relevant to authorization: some work-item operations are restricted to eligible team members.

## 6. Activity History

Activity History provides an audit-style view of recorded application actions.

To review activity:

1. Open the Activity or Activity History section.
2. Browse the available entries.
3. Review the action details and associated records.
4. Perform another permitted action, such as creating a work item or adding a comment, and revisit the history to see whether a corresponding entry was recorded.

The entries shown depend on which actions have occurred and the data available to the signed-in user.

## 7. Approval Workflow

The approval workflow supports reviewer-based decisions.

### Submit or locate an approval request

1. Open the Approvals section.
2. Review the available approval requests and their current status.
3. Identify the assigned reviewer for the request you want to evaluate.

### Approve or reject a request

1. Sign in using the account assigned as the reviewer.
2. Open the relevant approval request.
3. Select the permitted decision.
4. Submit the decision.
5. Confirm that the status changes accordingly.

### Important authorization rules

- Only the assigned reviewer can decide the request.
- A requester cannot approve their own request.
- A request that has already been decided cannot be decided again.

If a decision is unavailable, verify the signed-in account, reviewer assignment, and current request status before treating it as an application error.

## 8. Troubleshooting

### Login fails

- Check the email address for typing errors.
- Confirm that you are using the correct demo-account password.
- If Sarah Jenkins's quick-login shortcut fails, try manual login with valid credentials.
- Try another verified demo account.
- If multiple accounts fail, check the backend health endpoint.

### Backend health check

Open:

https://d3r6tlsh4r388k.cloudfront.net/api/health

A healthy response is expected to contain:

`{"status":"healthy","service":"newtonite-backend"}`

If the endpoint is unavailable, the backend or its network path may need investigation.

### A work-item action fails

- Confirm that you are signed in.
- Check whether your account belongs to the relevant team.
- Verify that the requested transition or update is permitted.
- Refresh the work item if another update may have occurred.

### An approval decision fails

- Confirm that you are signed in as the assigned reviewer.
- Ensure that you are not attempting to approve your own request.
- Check that the request is still pending.

### Comments do not appear

- Confirm that the comment submission succeeded.
- Refresh the work item and inspect its comments section.
- Verify that your account is permitted to access the item.

## 9. Technical Notes

The application uses:

- React and Vite for the frontend.
- Python and FastAPI for the backend.
- SQLAlchemy for database access.
- PostgreSQL for persistent relational storage.
- Alembic for database migrations.
- JWT-based authentication and password hashing.
- pytest and HTTPX for backend testing.
- AWS S3 and CloudFront for frontend delivery.
- AWS EC2, Uvicorn, and Nginx for backend hosting.

The production PostgreSQL database runs on the EC2 instance and is accessed locally by the backend. AWS RDS is not used in the current deployment.

Automated backend tests use a separate database named `newtonite_test_db`. The latest recorded test run completed with 17 passing tests.

## 10. Related Documentation

- [README.md](README.md) — Project overview, setup, and development instructions.
- [ENGINEERING_DECISIONS.md](ENGINEERING_DECISIONS.md) — Architecture, engineering choices, trade-offs, and known limitations.

---

This guide describes the intended application workflows. Available actions and displayed data may vary with the account, permissions, and current database state.
