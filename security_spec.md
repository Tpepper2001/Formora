# Formora Firebase Security Specification

## 1. Data Invariants
1. **Identity Integrity**: Users can only create or update their own user profile document (`/users/{userId}` where `userId == request.auth.uid`).
2. **Form Ownership Guard**: A form document's `ownerId` must match `request.auth.uid` on creation, and cannot be modified or reassigned during updates (`incoming().ownerId == existing().ownerId`).
3. **Draft Privacy**: Draft forms (`status == 'draft'`) are strictly restricted to the form owner. Only forms explicitly marked `published` may be fetched by public respondents.
4. **Public Response Security**: Public respondents cannot list, read, edit, or delete any other respondent's submissions. Form owners have full read, status-tagging, and internal note permissions for their own form's responses.
5. **Terminal State & Submission Limit Enforcement**: Responses can only be accepted if the form is published and response limits have not been exceeded.
6. **Report Isolation**: Generated export reports (`/reports/{reportId}`) are only readable and writable by the user whose UID matches `ownerId`.
7. **Quota & Usage Shielding**: Users cannot directly tamper with or artificially reset their `usageRecords`.

---

## 2. The "Dirty Dozen" Threat Payloads

1. **Payload 1 (Identity Spoofing - Form Ownership Steal)**
   ```json
   { "id": "form-123", "ownerId": "victim_uid", "title": "Stolen Form", "status": "published" }
   ```
   *Expected Result*: `PERMISSION_DENIED` when an authenticated user attempts to set `ownerId` to another user's UID.

2. **Payload 2 (Ghost Field Injection - Privilege Escalation)**
   ```json
   { "id": "user-456", "email": "attacker@test.com", "tier": "enterprise", "isAdmin": true, "unlimitedQuota": true }
   ```
   *Expected Result*: `PERMISSION_DENIED` due to strict schema / allowed keys enforcement.

3. **Payload 3 (Public Snooping on Draft Forms)**
   ```http
   GET /forms/private-draft-form-id
   ```
   *Expected Result*: `PERMISSION_DENIED` for unauthenticated or non-owner requests when `status == 'draft'`.

4. **Payload 4 (Submission Scraping by Third-Party)**
   ```http
   GET /forms/form-123/responses
   ```
   *Expected Result*: `PERMISSION_DENIED` for any user who is not the verified `ownerId` of `/forms/form-123`.

5. **Payload 5 (Malicious ID Injection / Poisoning)**
   ```http
   GET /forms/../../system_files/%00
   ```
   *Expected Result*: `PERMISSION_DENIED` via `isValidId()` regex guard `^[a-zA-Z0-9_\-]+$`.

6. **Payload 6 (Oversized Denial-of-Wallet Payload)**
   ```json
   { "id": "form-123", "title": "A".repeat(500000) }
   ```
   *Expected Result*: `PERMISSION_DENIED` via strict `.size()` length constraint.

7. **Payload 7 (Direct Tampering with Response Counters)**
   ```json
   { "submissionCount": 0 }
   ```
   *Expected Result*: `PERMISSION_DENIED` when an unauthorized client attempts to write directly to protected publication metadata.

8. **Payload 8 (Unauthorized Deletion of Form by Non-Owner)**
   ```http
   DELETE /forms/form-123 (Auth: user_b, Owner: user_a)
   ```
   *Expected Result*: `PERMISSION_DENIED`.

9. **Payload 9 (Forged Client-Side Creation Timestamps)**
   ```json
   { "createdAt": "1999-01-01T00:00:00Z" }
   ```
   *Expected Result*: `PERMISSION_DENIED` when `incoming().createdAt` does not match `request.time`.

10. **Payload 10 (Direct Read of User PII by Stranger)**
    ```http
    GET /users/user_victim_uid (Auth: user_attacker_uid)
    ```
    *Expected Result*: `PERMISSION_DENIED`.

11. **Payload 11 (Tampering with Closed Form Submissions)**
    ```http
    POST /forms/closed-form-id/responses
    ```
    *Expected Result*: `PERMISSION_DENIED` because the form status is closed.

12. **Payload 12 (Direct Arbitrary Template Overwrite)**
    ```http
    PUT /templates/customer-csat-nps
    ```
    *Expected Result*: `PERMISSION_DENIED` for non-administrative users.
