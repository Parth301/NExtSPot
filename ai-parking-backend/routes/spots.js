// routes/spots.js - Parking Spots Management
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");

// ================= USER ENDPOINTS =================

// Get all spots with availability (for USER map view)
router.get("/available", auth(["user"]), (req, res) => {
  const expireQuery = `
    UPDATE bookings 
    SET status = 'expired' 
    WHERE status = 'active' AND expires_at < NOW()
  `;
  
  db.query(expireQuery, (expireErr, expireResult) => {
    if (expireErr) {
      console.error("Error expiring bookings:", expireErr);
      // Continue anyway - don't block the request
    } else if (expireResult.affectedRows > 0) {
      console.log(`Expired ${expireResult.affectedRows} booking(s)`);
    }

    // Now fetch available spots with updated status
    const query = `
      SELECT 
        ps.id, ps.name, ps.latitude, ps.longitude, ps.price, ps.type,
        a.is_available,
        CASE 
          WHEN b.id IS NOT NULL AND b.status = 'active' THEN 'reserved'
          WHEN a.is_available = 1 THEN 'available'
          ELSE 'unavailable'
        END as status
      FROM parking_spots ps
      LEFT JOIN availability a ON ps.id = a.parking_id
      LEFT JOIN bookings b ON ps.id = b.parking_id AND b.status = 'active'
    `;

    db.query(query, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  });
});

// ================= OWNER ENDPOINTS =================

// Get all spots of the owner (OWNER dashboard)
router.get("/owner", auth(["owner"]), (req, res) => {
  // First, expire any bookings that have passed their time
  const expireQuery = `
    UPDATE bookings 
    SET status = 'expired' 
    WHERE status = 'active' AND expires_at < NOW()
  `;
  
  db.query(expireQuery, (expireErr, expireResult) => {
    if (expireErr) {
      console.error("Error expiring bookings:", expireErr);
      // Continue anyway - don't block the request
    } else if (expireResult.affectedRows > 0) {
      console.log(`Expired ${expireResult.affectedRows} booking(s)`);
    }

    // Now fetch owner's spots with updated status
    const query = `
      SELECT 
        ps.id,
        ps.owner_id,
        ps.name,
        ps.latitude,
        ps.longitude,
        ps.price,
        ps.type,
        ps.created_at,
        a.is_available,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.parking_id = ps.id AND b.status = 'active'
          ) THEN 'reserved'
          WHEN a.is_available = 1 THEN 'available'
          ELSE 'unavailable'
        END as status
      FROM parking_spots ps
      LEFT JOIN availability a ON ps.id = a.parking_id
      WHERE ps.owner_id = ?
      ORDER BY ps.name
    `;

    db.query(query, [req.user.id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  });
});

// Add new parking spot (OWNER only)
router.post("/add", auth(["owner"]), (req, res) => {
  const { name, latitude, longitude, price, type } = req.body;
  if (!name || !latitude || !longitude || !price || !type)
    return res.status(400).json({ message: "All fields required" });

  db.query(
    "INSERT INTO parking_spots (owner_id, name, latitude, longitude, price, type, created_at) VALUES (?,?,?,?,?,?, NOW())",
    [req.user.id, name, latitude, longitude, price, type],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const parkingId = result.insertId;

      db.query(
        "INSERT INTO availability (parking_id, is_available, updated_at) VALUES (?, 1, NOW())",
        [parkingId],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.status(201).json({ message: "Parking spot added", id: parkingId });
        }
      );
    }
  );
});

// Delete spot route
router.delete("/:id", auth(["owner"]), (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid spot ID" });

  const checkQuery = `
    SELECT ps.owner_id, b.id as booking_id, b.status
    FROM parking_spots ps
    LEFT JOIN bookings b ON ps.id = b.parking_id AND b.status='active'
    WHERE ps.id = ?
  `;

  db.query(checkQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.length) return res.status(404).json({ message: "Spot not found" });

    if (result[0].owner_id !== req.user.id)
      return res.status(403).json({ message: "Not your spot" });

    if (result[0].booking_id)
      return res.status(400).json({ message: "Cannot delete reserved spot" });

    db.query("DELETE FROM availability WHERE parking_id=?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      db.query("DELETE FROM parking_spots WHERE id=?", [id], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        res.json({ message: "Spot removed successfully" });
      });
    });
  });
});

// Toggle availability (OWNER only)
router.put("/:id/availability", auth(["owner"]), (req, res) => {
  const { id } = req.params;
  const { is_available } = req.body;

  // Check if spot exists and belongs to owner
  const checkQuery = `
    SELECT ps.owner_id, b.id as booking_id
    FROM parking_spots ps
    LEFT JOIN bookings b ON ps.id = b.parking_id AND b.status = 'active'
    WHERE ps.id = ?
  `;

  db.query(checkQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.length) return res.status(404).json({ message: "Spot not found" });

    if (result[0].owner_id !== req.user.id)
      return res.status(403).json({ message: "Not your spot" });

    if (result[0].booking_id && Number(is_available) === 0) {
      // Trying to mark a reserved spot unavailable
      return res.json({ message: "Spot is currently reserved" });
    }

    // Update availability
    db.query(
      "INSERT INTO availability (parking_id, is_available) VALUES (?, ?) ON DUPLICATE KEY UPDATE is_available = VALUES(is_available), updated_at = NOW()",
      [id, is_available],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const msg = result[0].booking_id ? "Spot is reserved" : `Spot ${is_available ? "enabled" : "disabled"}`;
        res.json({ message: msg });
      }
    );
  });
});

// Get owner's bookings (OWNER only)
router.get("/owner/bookings", auth(["owner"]), (req, res) => {
  const query = `
    SELECT 
      b.id as booking_id,
      b.reserved_at,
      b.expires_at,
      b.duration_hours,
      b.total_price,
      b.status,
      ps.id as spot_id,
      ps.name as spot_name,
      u.name as user_name,
      u.email as user_email
    FROM bookings b
    JOIN parking_spots ps ON b.parking_id = ps.id
    JOIN users u ON b.user_id = u.id
    WHERE ps.owner_id = ?
    ORDER BY b.reserved_at DESC
  `;

  db.query(query, [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});
module.exports = router;