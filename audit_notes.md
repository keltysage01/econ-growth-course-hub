# Website audit notes

## Live browser findings on 2026-04-12

- The live booking page at `https://econ-growth.com/book.html` loads over HTTPS in the browser session.
- The desktop booking page visually renders, but the calendar is **not connected automatically**.
- The page shows a visible prompt: **"Connect Watson's Google Calendar to see live availability"** with a **"Connect Calendar"** button.
- The calendar currently falls back to a local placeholder state and displays **"Select a date to see available times."**
- The codebase comment indicates the Google OAuth client requires authorized JavaScript origins, and the sample origin listed in the source is `https://econgrowth.com`, which does not match the deployed hostname `https://econ-growth.com`.
- The user-reported mobile issue is consistent with the source CSS: below 900px, `.nav-links` are hidden but the CTA remains visible, which would leave only the **"Book Your Growth Call"** button in the navbar.

## Immediate likely causes

1. **Mobile nav issue:** no hamburger/menu implementation exists; only nav links are hidden on small screens.
2. **Calendar auth issue:** Google OAuth origin configuration likely mismatches the live domain and the current implementation depends on client-side Google sign-in.
3. **SSL/security issue:** needs external verification at the deployed domain and likely hosting/domain configuration review.

## Google Cloud Console findings after login

- Signed-in account: `wheels.watson@gmail.com` (Watson Wheeler).
- Active Google Cloud project in the console: **My First Project** (`august-clover-488120-q3`).
- Existing OAuth 2.0 client detected: **Roger 1**.
- OAuth client type: **Web application**.
- OAuth client ID matches the booking page source: `939223794904-c8u6nsoqi02ukfodatipldnf5fh2s2ha.apps.googleusercontent.com`.
- Next required step: open the OAuth client configuration and verify the **Authorized JavaScript origins** and any related redirect settings for `https://econ-growth.com` and `https://www.econ-growth.com`.

The Google OAuth client configuration has been updated in the console draft state. The authorized JavaScript origins now include `https://econ-growth.com` and `https://www.econ-growth.com`. The client still shows an older ngrok redirect URI entry, which appears unrelated to the current static-site token flow and may indicate this credential was first created for a different implementation. I still need to verify the app audience and consent-screen state before finalizing the save.

The OAuth audience settings explain part of the booking failure. The app is currently set to **External** with **Publishing status: Testing**, and the only listed test user is `wheels.watson@gmail.com`. That means anyone else trying to authorize the booking flow can be blocked unless the app is published or they are added as test users.

The Google Auth Platform configuration now shows **Publishing status: In production** for the external app. On the OAuth client page, the authorized JavaScript origins have been re-entered as `https://econ-growth.com` and `https://www.econ-growth.com`, and the existing redirect URI remains the older ngrok callback. The next step is to save these client changes and then retest the live booking page.

## Apps Script backend deployment notes
- **Project**: Untitled project (Watson Wheeler)
- **Deployment URL**: `https://script.google.com/macros/s/AKfycby5pWyF_TawUei8-xqOJ4xG4S9sM0kX9n4Kbi2Sge6wF2GvS8oBHGnOtW3_J7eqa1AV/exec`
- **Status**: Deployed as Web App, accessible to "Anyone".
- **Functionality**: Real-time availability check and booking creation.
- **Integration**: The website code has been patched to use this backend for the custom booking UI.
