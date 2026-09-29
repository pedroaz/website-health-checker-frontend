# Browser showcase test plan

Start an isolated Compose stack with the demo-target profile. Use a fresh unique email for each scenario. Never rely on a public website, erase unrelated records, or remove assertions to make a failure disappear.

1. **Lifecycle and email:** create `/healthy`; expect Healthy and Email sent. Pause; visit details and see one check. Run Check now while paused; see a second check and two Mailpit emails for the unique recipient. Resume; observe a scheduled third check. Delete via confirmation; dashboard no longer includes the monitor.
2. **Unhealthy:** create `/failing`; expect Unhealthy, HTTP 503, and Sent email status in history.
3. **Timeout:** create `/slow`; expect an unhealthy result with a ten-second timeout explanation and a captured result email.
4. **Validation:** submit a loopback URL with a valid email; expect a private-network validation error and no monitor creation.
5. **Mobile:** open dashboard at 390 × 844; form controls remain available with no page-level horizontal overflow.
6. **Seed/exploration:** dashboard loads and the labelled URL field can be edited. Use this setup in agent planning and generation.

The backend suite separately verifies redirect limits and private redirects, real persistence, scheduler behavior, email failure independence, locking and structured API validation. The full runner restarts API/PostgreSQL and confirms the same saved monitor and history survive.
