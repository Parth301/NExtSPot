// routes/bookings.js - Multi-Slot Booking System
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");

// Reserve spot (USER) - Automatically assigns an available slot
router.post("/reserve/:parking_id", auth(["user"]), (req, res) => {
  const { parking_id } = req.params;
  const { duration_hours = 1 } = req.body;

  if (duration_hours < 1 || duration_hours > 8) {
    return res.status(400).json({ message: "Duration must be between 1 and 8 hours" });
  }

  // Check if parking spot exists and has available slots
  const checkQuery = `
    SELECT 
      ps.id, 
      ps.price, 
      ps.total_slots,
      ps.active_slots,
      ps.available_slots
    FROM parking_spots ps
    WHERE ps.id = ?
  `;

  db.query(checkQuery, [parking_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!result[0]) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    const spot = result[0];

    // Check if there are available slots
    if (spot.available_slots <= 0) {
      return res.status(400).json({ 
        message: "No parking slots available at this location",
        total_slots: spot.total_slots,
        active_slots: spot.active_slots,
        available_slots: spot.available_slots
      });
    }

    // Find an available slot
    const findSlotQuery = `
      SELECT id, slot_number
      FROM parking_slots
      WHERE parking_spot_id = ?
        AND is_active = 1
        AND is_available = 1
      ORDER BY slot_number ASC
      LIMIT 1
    `;

    db.query(findSlotQuery, [parking_id], (err2, slotResult) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      if (!slotResult.length) {
        return res.status(400).json({ 
          message: "No available slots found. Please try again."
        });
      }

      const slot = slotResult[0];
      const total_price = spot.price * duration_hours;

      // Create booking with assigned slot
      db.query(
        `INSERT INTO bookings 
         (user_id, parking_id, slot_id, reserved_at, expires_at, duration_hours, total_price, status) 
         VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? HOUR), ?, ?, 'active')`,
        [req.user.id, parking_id, slot.id, duration_hours, duration_hours, total_price],
        (err3, result3) => {
          if (err3) return res.status(500).json({ error: err3.message });
          
          // Mark slot as unavailable
          db.query(
            "UPDATE parking_slots SET is_available = 0 WHERE id = ?",
            [slot.id],
            (err4) => {
              if (err4) {
                console.error("Error updating slot availability:", err4);
              }
              
              // Update parking spot statistics
              db.query(
                `UPDATE parking_spots 
                 SET available_slots = available_slots - 1 
                 WHERE id = ?`,
                [parking_id],
                (err5) => {
                  if (err5) {
                    console.error("Error updating spot statistics:", err5);
                  }
                  
                  // Update availability table
                  db.query(
                    `UPDATE availability 
                     SET occupied_slots = occupied_slots + 1,
                         available_slots = available_slots - 1,
                         updated_at = NOW()
                     WHERE parking_id = ?`,
                    [parking_id],
                    (err6) => {
                      if (err6) {
                        console.error("Error updating availability table:", err6);
                      }
                      
                      res.status(201).json({
                        message: "Parking slot reserved successfully",
                        booking_id: result3.insertId,
                        slot_number: slot.slot_number,
                        slot_id: slot.id,
                        total_price,
                        duration_hours,
                        expires_at: new Date(Date.now() + duration_hours * 3600000).toISOString(),
                        slots_remaining: spot.available_slots - 1
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});

// Get user's reservations with slot details
router.get("/my-reservations", auth(["user"]), (req, res) => {
  const query = `
    SELECT 
      b.id as booking_id,
      b.parking_id,
      b.slot_id,
      b.reserved_at,
      b.expires_at,
      b.duration_hours,
      b.total_price,
      b.status,
      ps.name as spot_name,
      ps.latitude,
      ps.longitude,
      ps.type,
      ps.price as spot_price,
      ps.total_slots,
      ps.available_slots,
      sl.slot_number,
      CASE 
        WHEN b.status = 'active' AND b.expires_at > NOW() THEN 'active'
        WHEN b.status = 'active' AND b.expires_at <= NOW() THEN 'expired'
        ELSE b.status
      END as actual_status
    FROM bookings b
    JOIN parking_spots ps ON b.parking_id = ps.id
    LEFT JOIN parking_slots sl ON b.slot_id = sl.id
    WHERE b.user_id = ?
    ORDER BY b.reserved_at DESC
  `;
  
  db.query(query, [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// Cancel reservation - only within 5 minutes of booking
router.delete("/cancel/:booking_id", auth(["user"]), (req, res) => {
  const { booking_id } = req.params;
  
  db.query(
    "SELECT * FROM bookings WHERE id=?", 
    [booking_id], 
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const booking = result[0];
      if (!booking || booking.user_id !== req.user.id || booking.status !== "active") {
        return res.status(400).json({ message: "Cannot cancel booking" });
      }

      // Check if booking was made within last 5 minutes
      const bookingTime = new Date(booking.reserved_at);
      const currentTime = new Date();
      const timeDifferenceMinutes = (currentTime - bookingTime) / (1000 * 60);
      
      if (timeDifferenceMinutes > 5) {
        return res.status(400).json({ 
          message: "Cancellation not allowed. You can only cancel within 5 minutes of booking.",
          canCancel: false 
        });
      }

      // Cancel booking
      db.query(
        "UPDATE bookings SET status='cancelled', cancelled_at=NOW() WHERE id=?", 
        [booking_id], 
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          
          // Free up the slot
          if (booking.slot_id) {
            db.query(
              "UPDATE parking_slots SET is_available = 1 WHERE id = ?",
              [booking.slot_id],
              (err3) => {
                if (err3) {
                  console.error("Error freeing slot:", err3);
                }
                
                // Update parking spot statistics
                db.query(
                  `UPDATE parking_spots 
                   SET available_slots = available_slots + 1 
                   WHERE id = ?`,
                  [booking.parking_id],
                  (err4) => {
                    if (err4) {
                      console.error("Error updating spot statistics:", err4);
                    }
                    
                    // Update availability table
                    db.query(
                      `UPDATE availability 
                       SET occupied_slots = occupied_slots - 1,
                           available_slots = available_slots + 1,
                           updated_at = NOW()
                       WHERE parking_id = ?`,
                      [booking.parking_id],
                      (err5) => {
                        if (err5) {
                          console.error("Error updating availability table:", err5);
                        }
                        
                        res.json({ 
                          message: "Booking cancelled successfully. The parking slot is now available.",
                          canCancel: true,
                          slot_id: booking.slot_id
                        });
                      }
                    );
                  }
                );
              }
            );
          } else {
            res.json({ 
              message: "Booking cancelled successfully.",
              canCancel: true
            });
          }
        }
      );
    }
  );
});

// Get booking details with slot information
router.get("/:booking_id", auth(["user"]), (req, res) => {
  const { booking_id } = req.params;

  const query = `
    SELECT 
      b.id as booking_id,
      b.parking_id,
      b.slot_id,
      b.reserved_at,
      b.expires_at,
      b.cancelled_at,
      b.duration_hours,
      b.total_price,
      b.status,
      ps.name as spot_name,
      ps.latitude,
      ps.longitude,
      ps.type,
      ps.price as spot_price,
      ps.total_slots,
      ps.available_slots,
      sl.slot_number,
      sl.is_active as slot_is_active,
      CASE 
        WHEN b.status = 'active' AND b.expires_at > NOW() THEN 'active'
        WHEN b.status = 'active' AND b.expires_at <= NOW() THEN 'expired'
        ELSE b.status
      END as actual_status
    FROM bookings b
    JOIN parking_spots ps ON b.parking_id = ps.id
    LEFT JOIN parking_slots sl ON b.slot_id = sl.id
    WHERE b.id = ? AND b.user_id = ?
  `;

  db.query(query, [booking_id, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.length) return res.status(404).json({ message: "Booking not found" });
    res.json(result[0]);
  });
});

// Get real-time slot availability for a parking spot
router.get("/spot/:parking_id/availability", auth(["user", "owner"]), (req, res) => {
  const { parking_id } = req.params;

  const query = `
    SELECT 
      ps.id as parking_spot_id,
      ps.name,
      ps.total_slots,
      ps.active_slots,
      ps.available_slots,
      COALESCE(a.occupied_slots, 0) as occupied_slots,
      (
        SELECT COUNT(*) 
        FROM parking_slots 
        WHERE parking_spot_id = ps.id 
          AND is_active = 1 
          AND is_available = 1
      ) as real_time_available_slots,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'slot_id', id,
            'slot_number', slot_number,
            'is_active', is_active,
            'is_available', is_available,
            'status', CASE 
              WHEN is_active = 0 THEN 'disabled'
              WHEN is_available = 0 THEN 'occupied'
              ELSE 'available'
            END
          )
        )
        FROM parking_slots
        WHERE parking_spot_id = ps.id
        ORDER BY slot_number
      ) as slots_detail
    FROM parking_spots ps
    LEFT JOIN availability a ON ps.id = a.parking_id
    WHERE ps.id = ?
  `;

  db.query(query, [parking_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.length) return res.status(404).json({ message: "Parking spot not found" });
    
    const spot = result[0];
    // Parse JSON string if necessary
    if (typeof spot.slots_detail === 'string') {
      spot.slots_detail = JSON.parse(spot.slots_detail);
    }
    
    res.json(spot);
  });
});

// Get active bookings for a specific parking spot (OWNER endpoint)
router.get("/spot/:parking_id/active-bookings", auth(["owner"]), (req, res) => {
  const { parking_id } = req.params;

  // Verify ownership
  db.query(
    "SELECT owner_id FROM parking_spots WHERE id = ?",
    [parking_id],
    (err, ownerCheck) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!ownerCheck.length) return res.status(404).json({ message: "Parking spot not found" });
      
      if (ownerCheck[0].owner_id !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const query = `
        SELECT 
          b.id as booking_id,
          b.reserved_at,
          b.expires_at,
          b.duration_hours,
          b.total_price,
          b.status,
          sl.id as slot_id,
          sl.slot_number,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email
        FROM bookings b
        JOIN parking_slots sl ON b.slot_id = sl.id
        JOIN users u ON b.user_id = u.id
        WHERE b.parking_id = ? 
          AND b.status = 'active'
        ORDER BY sl.slot_number ASC
      `;

      db.query(query, [parking_id], (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(result);
      });
    }
  );
});

module.exports = router;