const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");

// Reserve spot (USER)
router.post("/reserve/:parking_id", auth(["user"]), (req, res) => {
  const { parking_id } = req.params;
  const { duration_hours = 1 } = req.body;

  const checkQuery = `
    SELECT ps.id, ps.price, a.is_available, b.id as existing_booking
    FROM parking_spots ps
    LEFT JOIN availability a ON ps.id=a.parking_id
    LEFT JOIN bookings b ON ps.id=b.parking_id AND b.status='active'
    WHERE ps.id=?
  `;
  db.query(checkQuery, [parking_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result[0] || !result[0].is_available || result[0].existing_booking)
      return res.status(400).json({ message: "Parking spot not available" });

    const total_price = result[0].price * duration_hours;
    db.query(
      "INSERT INTO bookings (user_id, parking_id, reserved_at, expires_at, duration_hours, total_price, status) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? HOUR), ?, ?, 'active')",
      [req.user.id, parking_id, duration_hours, duration_hours, total_price],
      (err2, result2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        // Update availability
        db.query("UPDATE availability SET is_available=0 WHERE parking_id=?", [parking_id]);
        res.status(201).json({
          message: "Parking spot reserved successfully",
          booking_id: result2.insertId,
          total_price,
          duration_hours
        });
      }
    );
  });
});

// Get user's reservations
router.get("/my-reservations", auth(["user"]), (req, res) => {
  const query = `
    SELECT 
      b.id as booking_id, b.reserved_at, b.expires_at, b.duration_hours, b.total_price, b.status,
      ps.name as spot_name, ps.latitude, ps.longitude, ps.type, ps.price as spot_price
    FROM bookings b
    JOIN parking_spots ps ON b.parking_id = ps.id
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
  
  db.query("SELECT * FROM bookings WHERE id=?", [booking_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const booking = result[0];
    if (!booking || booking.user_id !== req.user.id || booking.status !== "active") {
      return res.status(400).json({ message: "Cannot cancel booking" });
    }

    // Check if booking was made within last 5 minutes - use reserved_at field
    const bookingTime = new Date(booking.reserved_at);
    const currentTime = new Date();
    const timeDifferenceMinutes = (currentTime - bookingTime) / (1000 * 60);
    
    if (timeDifferenceMinutes > 5) {
      return res.status(400).json({ 
        message: "Cancellation not allowed. You can only cancel within 5 minutes of booking.",
        canCancel: false 
      });
    }

    db.query("UPDATE bookings SET status='cancelled', cancelled_at=NOW() WHERE id=?", [booking_id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      db.query("UPDATE availability SET is_available=1 WHERE parking_id=?", [booking.parking_id], (err3) => {
        if (err3) {
          console.error("Error updating availability:", err3);
        }
        
        res.json({ 
          message: "Booking cancelled successfully",
          canCancel: true 
        });
      });
    });
  });
});
module.exports = router;