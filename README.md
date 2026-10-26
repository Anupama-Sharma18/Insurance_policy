# Covera — Policy Operations Portal (Angular)

A responsive Angular frontend for the four uploaded Spring Boot services. The UI includes a dashboard and working policy, renewal, servicing and cancellation screens. Authentication has deliberately been left out, as requested.

## Included modules

- **Overview** — policy metrics, recent records, renewal pipeline and shortcuts.
- **Policies** — list/search/filter, create/update, lifecycle actions, document generation/download, coverages, riders, policy endorsements and policy history.
- **Renewals** — create renewal, send reminder, confirm customer and verify payment.
- **Policy servicing** — service requests, request status changes, endorsements with approve/reject, nominee management and service history.
- **Cancellations** — submit requests, view estimated refund, approve/reject with remarks.
- **Shared UI** — app shell, responsive sidebar/header/footer, reusable status badge, common styles and models.

## Tech stack and structure

- Angular standalone components + Angular Router
- TypeScript, template-driven forms and `HttpClient`
- `core/services/portal-data.service.ts` centralises service calls and local demo fallback
- `shared/models`, `shared/components`, `shared/pipes`
- `features/dashboard`, `features/policies`, `features/renewals`, `features/servicing`, `features/cancellations`
- `environments/environment.ts` and `environment.prod.ts`
- `proxy.conf.json` sends requests to the four Spring Boot services during local development

Authentication services, auth guards and auth interceptors are not included.

## Run it locally

1. Install **Node.js 20.19+ or 22.12+** and npm.
2. Open a terminal in this project folder.
3. Run:

   ```bash
   npm install
   npm start
   ```

4. Open the local URL shown by Angular CLI (usually `http://localhost:4200`).

The page loads demo seed data if an API request fails. In demo mode, changes are saved to browser `localStorage`, so create/update/status actions continue to work while the backend is unavailable. Clear the browser's site storage to restore the original demo seed records.

## Backend ports and API proxy

Start the Spring Boot services and their required MySQL databases, then run the frontend:

| Service | Port | Local proxy prefix |
|---|---:|---|
| Policy Insurance / Issuance | `8088` | `/backend/policies` |
| Policy Servicing | `8081` | `/backend/servicing` |
| Policy Renewal | `8082` | `/backend/renewals` |
| Policy Closure | `8083` | `/backend/closure` |

`proxy.conf.json` strips the frontend-only prefix before forwarding the request, so calls reach the original backend endpoints (for example, `/backend/policies/api/v1/policies` becomes `/api/v1/policies` at port `8088`). This avoids browser CORS issues during `ng serve` without modifying the backend services.

For deployment, configure your reverse proxy/API gateway to forward those `/backend/*` prefixes to the corresponding service. If your services return errors or a route is missing, the UI switches to local demo data rather than becoming unusable.

## Request examples matching the uploaded backends

- Policy list/create: `GET/POST /api/v1/policies` on port 8088
- Renewal list/create: `GET/POST /api/v1/renewals` on port 8082
- Service requests: `GET/POST /api/v1/service-requests` on port 8081
- Endorsements: `GET/POST /api/v1/endorsements` on port 8081
- Nominees: `GET /api/v1/nominees/policy/{policyId}` and `POST /api/v1/nominees` on port 8081
- Cancellation workflow: `/api/v1/cancellations` on port 8083

## Notes

- There is no auth UI, auth service, route guard or token interceptor.
- The UI uses sample product names for readability because the supplied policy response contains `productId`, not product names.
- The closure DTO expects `approvedBy`; the UI uses `1` for local testing. Replace this with the authenticated approver identity once authentication is introduced.
- Renewal payment verification is presented as an operations action. Use the backend response/status as the source of truth when the renewal API is running.
- A generated document is downloaded as the backend's blob response in live mode. In demo mode, the download is a small text placeholder, not a real PDF.
