/**
 * GrabExpress — Express backend
 *
 * NOTE: All primary data (bookings, users) lives in Firebase Firestore.
 * The React frontend talks to Firestore directly — this server is NOT
 * required for the app to run. XAMPP / MySQL are not used.
 *
 * This file is kept as a thin Express server in case you need to add
 * server-side logic in the future (e.g. payment gateway webhooks,
 * push notifications, admin-only bulk queries).
 *
 * To start: node index.js   or   npx nodemon index.js
 */

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    ok:      true,
    message: 'GrabExpress API is running.',
    time:    new Date().toISOString(),
    note:    'All app data lives in Firebase Firestore. This server is optional.',
  });
});

// ─── Placeholder for future server-side features ──────────────────────
//
//  Ideas for what you could add here later:
//    - Payment gateway webhooks (GCash, PayMongo)
//    - Scheduled jobs (auto-expire searching bookings after 10 min)
//    - SMS notifications via Semaphore API
//    - Admin-only bulk data exports
//
// ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`GrabExpress API running on http://localhost:${PORT}`);
  console.log('Note: The React app connects directly to Firestore — this server is optional.');
});
