const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Refresh expired bookings
router.post("/refresh-availability", (req, res) => {
  const expireQuery = "UPDATE bookings SET status='expired' WHERE status='active' AND expires_at < NOW()";
  db.query(expireQuery, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Make spots available again
    db.query("UPDATE availability SET is_available=1 WHERE parking_id IN (SELECT parking_id FROM bookings WHERE status='expired')");

    res.json({ message: "System refresh completed", expired_bookings: result.affectedRows });
  });
});

// Dashboard stats
router.get("/stats", (req, res) => {
  const queries = {
    total_spots: "SELECT COUNT(*) as count FROM parking_spots",
    available_spots: "SELECT COUNT(*) as count FROM availability WHERE is_available=1",
    reserved_spots: "SELECT COUNT(*) as count FROM bookings WHERE status='active'",
    total_bookings: "SELECT COUNT(*) as count FROM bookings"
  };

  Promise.all(Object.values(queries).map(q => new Promise((resolve, reject) => db.query(q, (err, r) => err ? reject(err) : resolve(r[0].count)))))
    .then(([total, available, reserved, bookings]) => {
      res.json({ total_spots: total, available_spots: available, reserved_spots: reserved, unavailable_spots: total - available - reserved, total_bookings: bookings });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

module.exports = router;