# Security Specification & Test Matrix

## 1. Data Invariants
1. **Donor Identity & Ownership**: A donor record can only be created with `userId == request.auth.uid`. A donor record can only be updated or deleted by its owning user or verified admin.
2. **Donor Phone & Data Validation**: `phone` must be a valid phone string (between 7 and 20 chars). `fullName` and `residence` cannot exceed length constraints. `bloodType` must belong strictly to `['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']`.
3. **Urgent Request Invariants**: A request can only be authored with `userId == request.auth.uid`. Only the author can update fields (like closing the status to `fulfilled`).
4. **User Profile Isolation**: Users can only create and modify their own `/users/{userId}` record where `{userId} == request.auth.uid`. Role privilege escalation to 'admin' is prevented.
5. **Catch-All Default Deny**: All unmapped collections or pathways are blocked by default.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Spoofed Donor Creator**: `{ "userId": "attacker_123", "fullName": "علي", "bloodType": "O+", ... }` sent by `victim_456`.
2. **Invalid Blood Type in Donor**: `{ "bloodType": "X-POSITIVE", ... }`.
3. **Huge String Injection in Residence**: Residence string of length > 150 chars.
4. **Donor Update Gap (Ghost Field injection)**: Attempting to update donor with `{ "isAdmin": true, "verified": true }`.
5. **Unauthorized Donor Deletion**: Attacker trying to delete another user's donor document.
6. **Spoofed Urgent Request Author**: Author UID does not match `request.auth.uid`.
7. **Invalid Units Needed**: Negative or non-numeric units count in urgent request.
8. **Malicious Request Status**: Setting status to arbitrary non-enum string like `deleted_bypass`.
9. **Unauthorized Closure of Urgent Request**: User B trying to mark User A's urgent request as fulfilled.
10. **Admin Escalation on User Profile**: Regular user writing `{ "role": "admin" }` to their user profile.
11. **Cross-User Profile Hijack**: User A writing to `/users/user_B`.
12. **Blanket Write to Root / System**: Writing to undeclared paths like `/config/app`.
