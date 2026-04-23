# Security Specification

## Data Invariants
1. `User`: A user document MUST strictly contain `displayName` and `createdAt`. Modifications can only be made by the owning `userId`.
2. `Review`: A review MUST be tied to the `request.auth.uid`. It requires an `entityId`, `rating` (1-10), and cannot be modified after creation.
3. `Submission`: Submissions MUST be tied to `request.auth.uid`. The `status` defaults to "pending" and users cannot bypass it to "approved".
4. `Leaderboard`: Updates to `LeaderboardEntry` must restrict schema carefully. (For simplicity in client app, any signed-in user can update the leaderboard stats, but they must strictly maintain schema types).

## The "Dirty Dozen" Payloads
1. User with extra `isAdmin` field.
2. User with incorrect `userId`.
3. User updating `createdAt`.
4. Review with `userId` not matching auth.
5. Review with rating `11`.
6. Review with comment > 2000 chars.
7. Submission with `status` set to `approved` by regular user on create.
8. Submission without `url`.
9. Leaderboard update injecting 1MB `title`.
10. Anonymous user attempting to create a review.
11. Querying emails/PII (We do not store emails).
12. Attempting to delete someone else's review.
