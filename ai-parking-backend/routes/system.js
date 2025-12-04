const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Refresh expired bookings
router.post("/refresh-availability", (req, res) => {
  // First, find all expired bookings with their slot info
  const findExpiredQuery = `
    SELECT b.id, b.slot_id, b.parking_id 
    FROM bookings b
    WHERE b.status = 'active' AND b.expires_at < NOW()
  `;

  db.query(findExpiredQuery, (err, expiredBookings) => {
    if (err) return res.status(500).json({ error: err.message });

    if (expiredBookings.length === 0) {
      return res.json({
        message: "No expired bookings to refresh",
        expired_bookings: 0,
      });
    }

    // Update bookings to expired
    const expireQuery = `
      UPDATE bookings 
      SET status = 'expired' 
      WHERE status = 'active' AND expires_at < NOW()
    `;

    db.query(expireQuery, (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // Free up the slots
      const slotIds = expiredBookings.map((b) => b.slot_id).filter(Boolean);

      if (slotIds.length > 0) {
        db.query(
          "UPDATE parking_slots SET is_available = 1 WHERE id IN (?)",
          [slotIds],
          (err3) => {
            if (err3) console.error("Error freeing slots:", err3);

            // Update parking_spots statistics
            const parkingIds = [
              ...new Set(expiredBookings.map((b) => b.parking_id)),
            ];

            parkingIds.forEach((parkingId) => {
              db.query(
                `UPDATE parking_spots 
                 SET available_slots = (
                   SELECT COUNT(*) FROM parking_slots 
                   WHERE parking_spot_id = ? AND is_active = 1 AND is_available = 1
                 )
                 WHERE id = ?`,
                [parkingId, parkingId]
              );

              db.query(
                `UPDATE availability 
                 SET occupied_slots = (
                   SELECT COUNT(*) FROM bookings 
                   WHERE parking_id = ? AND status = 'active'
                 ),
                 available_slots = (
                   SELECT COUNT(*) FROM parking_slots 
                   WHERE parking_spot_id = ? AND is_active = 1 AND is_available = 1
                 ),
                 updated_at = NOW()
                 WHERE parking_id = ?`,
                [parkingId, parkingId, parkingId]
              );
            });

            res.json({
              message: "System refresh completed",
              expired_bookings: result.affectedRows,
              slots_freed: slotIds.length,
            });
          }
        );
      } else {
        res.json({
          message: "System refresh completed",
          expired_bookings: result.affectedRows,
          slots_freed: 0,
        });
      }
    });
  });
});

// Dashboard stats - Updated for multi-slot system
router.get("/stats", (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(DISTINCT ps.id) as total_spots,
      COALESCE(SUM(ps.total_slots), 0) as total_slots,
      COALESCE(SUM(ps.active_slots), 0) as active_slots,
      COALESCE(SUM(ps.available_slots), 0) as available_spots,
      COALESCE(SUM(a.occupied_slots), 0) as reserved_spots,
      COALESCE(SUM(CASE WHEN ps.active_slots = 0 THEN ps.total_slots ELSE 0 END), 0) as unavailable_spots,
      (
        SELECT COUNT(*) 
        FROM bookings 
        WHERE status = 'active' AND expires_at > NOW()
      ) as active_bookings,
      (
        SELECT COUNT(*) 
        FROM bookings 
        WHERE status = 'active' AND expires_at <= NOW()
      ) as expired_bookings_count,
      (
        SELECT COUNT(*) 
        FROM bookings
      ) as total_bookings
    FROM parking_spots ps
    LEFT JOIN availability a ON ps.id = a.parking_id
  `;

  db.query(statsQuery, (err, result) => {
    if (err) {
      console.error("System stats error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (!result.length) {
      return res.json({
        total_spots: 0,
        total_slots: 0,
        active_slots: 0,
        available_spots: 0,
        reserved_spots: 0,
        unavailable_spots: 0,
        active_bookings: 0,
        expired_bookings_count: 0,
        total_bookings: 0,
      });
    }

    res.json(result[0]);
  });
});

// Get owner-specific statistics
router.get("/owner/stats/:owner_id", (req, res) => {
  const { owner_id } = req.params;

  const ownerStatsQuery = `
    SELECT 
      COUNT(DISTINCT ps.id) as total_spots,
      COALESCE(SUM(ps.total_slots), 0) as total_slots,
      COALESCE(SUM(ps.active_slots), 0) as active_slots,
      COALESCE(SUM(ps.available_slots), 0) as available_spots,
      COALESCE(SUM(a.occupied_slots), 0) as reserved_spots,
      COALESCE(SUM(CASE WHEN ps.active_slots = 0 THEN 1 ELSE 0 END), 0) as unavailable_spots,
      (
        SELECT COUNT(*) 
        FROM bookings b
        JOIN parking_spots ps2 ON b.parking_id = ps2.id
        WHERE ps2.owner_id = ? AND b.status = 'active' AND b.expires_at > NOW()
      ) as active_bookings,
      (
        SELECT COALESCE(SUM(b.total_price), 0)
        FROM bookings b
        JOIN parking_spots ps2 ON b.parking_id = ps2.id
        WHERE ps2.owner_id = ? AND b.status IN ('active', 'completed')
      ) as total_revenue
    FROM parking_spots ps
    LEFT JOIN availability a ON ps.id = a.parking_id
    WHERE ps.owner_id = ?
  `;

  db.query(ownerStatsQuery, [owner_id, owner_id, owner_id], (err, result) => {
    if (err) {
      console.error("Owner stats error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (!result.length) {
      return res.json({
        total_spots: 0,
        total_slots: 0,
        active_slots: 0,
        available_spots: 0,
        reserved_spots: 0,
        unavailable_spots: 0,
        active_bookings: 0,
        total_revenue: 0,
      });
    }

    res.json(result[0]);
  });
});

module.exports = router;
