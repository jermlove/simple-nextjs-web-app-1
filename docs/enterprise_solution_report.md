# Enterprise Solution Report: Migrating Reader Identity Data to Azure Entra External ID

## Table of Contents
1. Executive Summary
2. Architecture
3. Data Mapping
4. Identity Flows
5. Migration Plan
6. Compliance
7. Appendix
8. Software Requirements Specification (SRS): Vercel App with Microsoft Entra External ID Authentication

---

## Executive Summary
The purpose of this report is to outline the solution for migrating the reader identity data and authentication system from the current platform to Microsoft Azure Entra External ID.
Azure Entra External ID will act as the new customer identity & access management platform, replacing the legacy in-house identity system.

The migration goals:
## Key Objectives
- **Unified Identity Platform** – All reader logins managed centrally in Azure.
- **Improved Security & Compliance** – MFA, threat protection, encryption built-in.
- **Enhanced User Experience** – Social login, passwordless auth, modern login UX.
- **Scalability & Reliability** – Microsoft global infrastructure handles load.
- **Reduced Maintenance** – No custom auth stack & patching requirements.

The report details:
- ✔ Target architecture
- ✔ User data mapping & schema conversion
- ✔ Authentication flow redesign
- ✔ Migration & cutover plan
- ✔ Compliance considerations

Successful execution results in minimal disruption to users and positions identity for future growth.

## 1. Architecture
### Target Architecture Overview
Azure Entra External ID becomes the central identity store and authentication provider for all reader-facing applications.

Components:
| Component                      | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| Azure Entra External ID Tenant | Stores reader identities, credentials, attributes       |
| Reader-Facing Applications     | Authenticate via OAuth2/OIDC; no local passwords        |
| Authentication Flow            | Redirect → Azure Hosted Login → Token Response          |
| User Profile Data              | Core data in Azure, extended profile external if needed |
| Integration Services           | Graph API, Functions, event sync to marketing systems   |
| Admin/DevOps                   | Portal management + IaC deployment flows                |

### Authentication Flow (simplified)
```pgsql
User → Reader App → Azure Entra External ID (login) → returns ID token → App establishes session
```
The app is no longer responsible for validating passwords — only token validation.

### Architectural Diagram — Text Map
```lua
[Reader Web/Mobile App] --(OIDC)--> [Azure External ID Tenant]
      ^        |                                 |
      |        |----(Graph API)------------------|
      |        |----(Integration)--> Marketing/Analytics Systems
      |<---(ID Token Response)-------------------|

```

### Component Responsibilities
#### Azure Entra External ID Tenant
- Stores all user identities + custom attributes
- Provides login, signup, password reset user flows
- Enforces MFA policies, credential strength, lockouts
#### Reader Applications
- Registered as relying parties (OIDC clients)
- Receive & validate ID tokens (JWT)
- No password handling or credential storage
#### Custom APIs / Services
- Transition identity authorization to Azure tokens
- Legacy user API may retire or proxy Graph API
#### Identity Provider Integration
- Google, Facebook, LinkedIn supported natively
- Azure manages federation, not the application
#### Monitoring
- Azure Sign-in Logs, Risk Reports, Audit Trails
- SIEM integration supported for threat intelligence


## 2. Data Mapping
Migration requires mapping legacy reader records to Azure Entra External ID schema. Azure supports built-in identity fields and custom directory attributes for extending user profile data.
### User Data Migration Table
| Legacy Field                            | Description                    | Azure Attribute                                             |
| --------------------------------------- | ------------------------------ | ----------------------------------------------------------- |
| Email/Username                          | Primary login identifier       | `identities[*].issuerAssignedId` (sign-in username)         |
| Password Hash                           | Legacy hashed credential       | Azure password store (temp password or migration framework) |
| First Name                              | Given name                     | `givenName`                                                 |
| Last Name                               | Surname                        | `surname`                                                   |
| Full Name                               | Display name                   | `displayName`                                               |
| Company                                 | Organization attribute         | Custom attribute: `extension_company`                       |
| Job Title                               | User role or position          | Custom attribute: `extension_jobTitle`                      |
| Phone Number                            | Contact identity               | `mobilePhone` or custom                                     |
| Address (Street/City/State/Zip/Country) | Physical mailing info          | Stored as JSON or multiple custom attributes                |
| Newsletter Consent (NlConsent)          | Opt-in boolean                 | `extension_newsletterConsent` (true/false)                  |
| Client Consent (Terms)                  | Legal acceptance flag          | `extension_termsAccepted`                                   |
| Subscriptions                           | Reader newsletter/program list | Stored externally (Marketo, DB) w/ link ID                  |
| Roles/Access Level                      | Premium tier/access rights     | Azure Groups or App Roles                                   |
| Legacy User ID                          | Internal reference key         | `extension_legacyId`                                        |
| Additional Emails                       | Secondary communication emails | `otherMails` or custom multi-value                          |
| Password Reset Flag                     | “Must reset next login” status | `passwordProfile.forceChangePasswordNextSignIn`             |

> Custom attributes are typically prefixed by the Directory/Client App GUID.<br/>
> Example: `extension_ABC123_newsletterConsent`

### Example JSON Payload — Create User in Azure
```json
{
  "accountEnabled": true,
  "identities": [
    {
      "signInType": "emailAddress",
      "issuer": "<tenant>.onmicrosoft.com",
      "issuerAssignedId": "john.doe@example.com"
    }
  ],
  "givenName": "John",
  "surname": "Doe",
  "displayName": "John Doe",
  "passwordProfile": {
    "password": "TempPassword123!",
    "forceChangePasswordNextSignIn": true
  },
  "extension_ABC123_newsletterConsent": true,
  "extension_ABC123_termsAccepted": true,
  "extension_ABC123_legacyId": "OLD-UID-5689",
  "extension_ABC123_company": "Acme Corp",
  "extension_ABC123_jobTitle": "Senior Editor"
}
```
Used during automated import or Graph-based provisioning.

## 3. Identity Flows
Azure Entra External ID replaces legacy login, registration, password reset, and profile management. The new system provides scalable, secure user management with minimal custom code.
### 3.1 User Registration (Sign-Up)
Process:
1. User selects Register on site.
2. Application redirects to Azure Entra External ID Signup Flow.
3. Azure-hosted page collects:
      - Email (username)
      - Password
      - First/Last Name
      - Consent checkboxes (Terms / Newsletter)
4. Azure validates uniqueness & password policy.
5. Email verification (optional) before account activation.
6. User redirected back with ID token → session created.

Progressive profiling remains optional — after signup, user may be directed to complete profile fields within the app.
### 3.2 User Login (Sign-In)
1. User visits app and selects Login
2. Application redirects to Azure Sign-In Policy (OIDC)
3. Azure validates credentials
      - If valid → returns ID token, optionally refresh token
      - If invalid → error displayed on Azure UI
      - If flagged for password reset → continues into reset flow
4. Application establishes session based on token claims    
SSO is supported across all sites using the same tenant.

Token handling:
| Token Type              | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| ID Token                | Identity + Claims for session establishment |
| Refresh Token           | Redeem new ID tokens silently               |
| Access Token (optional) | For Graph API calls                         |

### 3.3 Social Login Flow (Google, Facebook, LinkedIn, etc.)
If user selects Sign in with Google:
```pgsql
User → Azure Login Screen → External Social Provider Auth →
Azure verifies result → Issues ID Token to application
```
**Behaviors:**
| Scenario                | Result                                       |
| ----------------------- | -------------------------------------------- |
| First-time social login | New user created automatically               |
| Returning user          | Account recognized + signed in               |
| Merged identity         | Email-based identity reconciliation optional |

Azure manages OAuth federation — apps do not directly integrate with social providers.

### 3.4 Password Reset Flow
1. User clicks Forgot Password
2. Redirect to Azure reset policy
3. Azure verifies identity via email/SMS code
4. User enters new password
5. App receives token or redirects to login

This eliminates custom reset token workflows and SMTP dependency.

### 3.5 Edit Profile Flow
**Options:**
| Approach                        | Storage                                    | When to Use                                             |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Azure-hosted Edit Profile Flow  | Writes attribute changes directly to Azure | Basic identity fields (name, contact, boolean consents) |
| In-App Profile Page + Graph API | App updates Azure via token/API            | Extended fields, marketing preferences                  |
| Hybrid                          | Mix of both models                         | Common real-world deployment                            |

Identity-related edits should always occur through Azure flows.

### Authorization Post-Migration
- User identity represented by OID/Subject claim, not legacy user ID
- Tokens expire; refresh tokens maintain session
- Multi-application session = seamless cross-site SSO

Logout clears both local + Azure session (optional federated sign-out).

## 4. Migration Plan
Migration will execute in phases to ensure controlled rollout, safe cutover, and minimal disruption to users.
### Phase 1 — Planning & Preparation
| Task                        | Deliverables                                                   |
| --------------------------- | -------------------------------------------------------------- |
| Project Alignment           | Stakeholders, technical owners, timeline approval              |
| Azure Tenant Setup          | New External ID tenant specifically for reader accounts        |
| Custom Attribute Definition | Create directory schema extensions for profile fields          |
| User Flow Configuration     | Sign-up, sign-in, password reset, profile edit                 |
| Branding + UI               | Logo, colors, messaging applied in Azure UI                    |
| Application Integration     | Update apps to use OIDC, register app IDs, configure redirects |
| DevOps & IaC                | ARM/Bicep/Terraform scripts for tenant config                  |
| Security Review             | MFA, lockout rules, token lifetime, auditing compliance        |

User flows are tested independently to validate UI/logic before integration.

### Phase 2 — Data Migration Execution
#### Legacy Data Export
Extract users from legacy identity store:
- User profile records
- Account fields
- Consents
- Password hash (if re-usable)\
- Secondary identifiers

Sanitize dataset — dedupe emails, validate required fields.

#### Password Migration Strategy
Option A — **Password Migration via Custom Policy**
- Azure calls legacy auth API to validate hashes on first login
- Password is re-set in Azure after successful login
- Seamless user experience
- Most complex to implement

Option B — **Temporary Password + Forced Reset (Recommended)**
- System generates random password for each user
- `forceChangePasswordNextSignIn = true`
- Users perform password reset at first login
- Most secure & fastest deployment path

#### Batch Import Steps
1. Transform exported DB → JSON or CSV
2. Use Microsoft Graph / PowerShell / CLI to bulk create identities
3. Write extension attributes during import
4. Enable `accountEnabled = true`
5. Run validation sampling after creation

**Delta sync** may be required for late-stage user changes.

#### Pre-Go-Live Test Coverage
| Validation Area   | Expected Result                             |
| ----------------- | ------------------------------------------- |
| Sign-in / Sign-up | Successful token issuance                   |
| Password Reset    | Email verification + reset success          |
| Social Login      | Auto matching & new identity creation       |
| Profile Update    | Azure and external DB attribute sync        |
| Integration       | Marketo/analytics response pipelines        |
| Edge Cases        | Locked accounts, invalid emails, MFA prompt |

### Phase 3 — Cutover & Go-Live
#### User Communication
Notify users of upcoming changes:
- New login UI
- One-time password reset requirement (if chosen)
- Short maintenance window (if needed)
- Support contact for transition issues

Email template included in Appendix C.

#### Production Enablement Checklist
| Action                                         | Required |
| ---------------------------------------------- | -------- |
| Switch app authentication to Azure External ID | ✔        |
| Confirm redirect URIs + secrets exist in prod  | ✔        |
| Run final delta migration batch                | ✔        |
| Perform smoke test in prod                     | ✔        |

Smoke test includes:
- New registration
- Login
- Password reset
- Social auth
- Profile updates
- Marketo/newsletter sync validation


#### Legacy System Decommissioning
Short-term:
- Maintain read-only state for verification
- Disable legacy login endpoints to avoid confusion
Long-term:
- Export/archive data
- Remove old auth services from codebase
- Destroy sensitive credential stores

### Phase 4 — Post-Migration Stabilization
#### Key activities after cutover:
| Task                         | Purpose                               |
| ---------------------------- | ------------------------------------- |
| Collect user feedback        | Improve UI+support clarity            |
| Tune token/session policies  | Balance experience vs. security       |
| Evaluate MAU-based billing   | Monitor Azure cost model              |
| Decommission remaining infra | Reduce operational footprint          |
| Update documentation         | New operational runbooks for support  |
| Train support teams          | Reset handling, user unlock, deletion |

Future enhancements may include:
- Additional identity providers
- Risk-based conditional access
- OTP/Authenticator MFA rollout
- Enriched analytics + login behavior insights

## 5. Compliance
Azure External ID strengthens privacy & security posture.

### Data Privacy & Protection
| Safeguard      | Detail                                                |
| -------------- | ----------------------------------------------------- |
| Encryption     | Data encrypted at rest & in transit                   |
| Data Location  | Tenant region can align w/ residency law requirements |
| Access Control | RBAC limits elevated access to admins only            |
| Auditing       | Administrative actions logged centrally               |

### User Consent & Rights (GDPR, CCPA)
| Requirement              | Implementation                                           |
| ------------------------ | -------------------------------------------------------- |
| Newsletter consent       | `extension_newsletterConsent` boolean captured at signup |
| Terms acceptance         | Stored as custom attribute w/ optional timestamp         |
| Data erasure             | Admin/API-driven deletion + downstream cleanup           |
| Data export              | Graph API retrieval for portability bundles              |
| Data minimization        | Only required identity attributes stored in Azure        |

### Security Enhancements
- Optional MFA for reader accounts
- Risk-based detection for suspicious logins
- SIEM integration for threat intelligence
- Rapid credential reset capability in breach scenarios


## 6. Appendix

### Appendix A — Architecture Diagram Reference
> A visual architecture diagram may be produced if needed.<br/>
> Recommended diagram elements:

Components to include:
- Reader Browser
- Application Frontend / Backend
- Azure External ID Tenant (CIAM)
- Marketo + Analytics Systems
- Graph API Interface Layer

Data Flows:
```pgsql
Login Request  → Azure External ID
ID Token       ← Auth Response
User Profile   ←→ Graph API
Marketing Sync → Marketo
```

### Appendix B — Legacy vs New Comparison
| Feature               | Legacy Platform          | Azure Entra External ID                      |
| --------------------- | ------------------------ | -------------------------------------------- |
| Authentication        | Custom DB & APIs         | Azure managed OIDC identity store            |
| Password Handling     | Internal storage & reset | Secure password store + self-service reset   |
| Social Login          | Auth0 pass-through       | Native social identity federation            |
| MFA                   | Not supported            | Available via SMS/Authenticator              |
| Registration          | Multi-step on app        | Azure-hosted user flows                      |
| Profile Data Location | MongoDB + Marketo        | Azure core data + external extended data     |
| Consent Logging       | Basic flags              | Stored as attributes; extensible             |
| Logging & Security    | Application logs only    | Global audit logs, risky sign-in reports     |
| Compliance Burden     | High internal control    | Shared responsibility w/ Microsoft standards |
| Scalability           | Vertical scale limits    | Auto-scale global capacity                   |
| Development Effort    | High maintenance         | Reduced to configuration-driven model        |
| Cost Model            | Infra + Auth0            | Pay-as-you-go MAU billing                    |
| Feature Delivery Time | Slow feature rollout     | Fast config-based activation                 |

### Appendix C — User Email Template
**Subject:** Upcoming Update – Improved Azure-Based Login Experience

Dear User,

We are upgrading our login system to Microsoft Azure for improved security, reliability, and future authentication capabilities. You will notice a new sign-in page beginning next week.

**What to Expect**

Modern login screen powered by Azure

Faster access across all sites

Improved security and protection of your account

**Action Required**
For your first login, you'll be asked to reset your password.
Simply select **Forgot Password** and follow the instructions.

If you have any trouble, please contact support.

Thank you,
**The Team**

### Appendix D — Microsoft Documentation Links
| Source                                        | Summary                                        |
| --------------------------------------------- | ---------------------------------------------- |
| Microsoft Learn — Entra External ID Overview  | Capabilities & platform architecture           |
| Microsoft Learn — Deployment Guide            | Best-practice tenant deployment                |
| Azure AD B2C Docs (legacy)                    | Custom policy & user migration references      |
| Internal Schema Specification Document ID XYZ | Legacy attribute mapping catalog               |
| GDPR Compliance Checklist                     | Consent, deletion, access request requirements |

## 7. Software Requirements Specification (SRS): Vercel App with Microsoft Entra External ID Authentication

### 1. Introduction
#### 1.1 Purpose
This document specifies the requirements for a demonstration web application deployed on Vercel, which authenticates users via Microsoft Entra External ID. The app will showcase both public and protected views, including a dashboard and profile page accessible only to authenticated users.

#### 1.2 Scope
- **Platform:** Vercel (Next.js recommended)
- **Authentication:** Microsoft Entra External ID (OIDC/OAuth2)
- **Views:**
  - Public (no login required)
  - Protected (login required): Dashboard, Profile
- **Audience:** Demonstration for technical and business stakeholders

### 2. Overall Description
#### 2.1 Product Perspective
The app is a standalone demonstration, not intended for production use. It integrates with Microsoft Entra External ID for authentication and authorization.

#### 2.2 User Classes and Characteristics
- **Anonymous User:** Can access public views only
- **Authenticated User:** Can access protected dashboard and profile views

#### 2.3 Operating Environment
- Deployed on Vercel
- Modern browsers (Edge, Chrome, Firefox, Safari)
- Microsoft Entra External ID tenant (test/demo)

#### 2.4 Design and Implementation Constraints
- No local password storage
- All authentication via Entra External ID
- Use of OIDC-compliant libraries (e.g., NextAuth.js)

### 3. Functional Requirements
#### 3.1 Public Views
- **Home Page:**
  - Accessible to all users
  - Contains information about the demo and a login button
- **About Page:**
  - Describes the app’s purpose and Entra External ID integration

#### 3.2 Authentication
- **Login:**
  - Redirects to Microsoft Entra External ID login page
  - Supports email/password and social login (if configured)
- **Logout:**
  - Ends local session and optionally signs out from Entra

#### 3.3 Protected Views
- **Dashboard:**
  - Accessible only to authenticated users
  - Displays user-specific welcome message and demo data
- **Profile Page:**
  - Shows user claims (name, email, etc.) from Entra token
  - Option to trigger profile edit (redirect to Entra profile flow)

#### 3.4 Access Control
- Unauthenticated users attempting to access protected views are redirected to login
- Authenticated users can access all protected views

### 4. Non-Functional Requirements
- **Security:**
  - All protected routes require valid Entra ID token
  - No sensitive data stored in browser local storage
- **Performance:**
  - Page loads < 2 seconds on Vercel
- **Reliability:**
  - Handles token expiration and session renewal gracefully
- **Usability:**
  - Simple, modern UI for demonstration

### 5. External Interfaces
- **Microsoft Entra External ID:** OIDC endpoints for authentication
- **Vercel:** Hosting and deployment

### 6. Demo Scenarios
- Anonymous user browses public pages
- User logs in via Entra External ID
- Authenticated user accesses dashboard and profile
- User logs out and is redirected to public home

### 7. Appendix
- References to Microsoft Entra External ID documentation
- Example OIDC configuration for Next.js

---
*This SRS is for demonstration purposes and can be extended for production use as needed.*
