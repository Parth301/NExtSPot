import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, ArrowLeft, X, CheckCircle, AlertCircle, Star } from "lucide-react";

function UserReservations() {
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [reviewEligibility, setReviewEligibility] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReview, setCurrentReview] = useState({
    parking_id: null,
    booking_id: null,
    spot_name: "",
    rating: 0,
    comment: "",
    cleanliness_rating: 0,
    safety_rating: 0,
    accessibility_rating: 0
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  
  const token = localStorage.getItem("token");

  // Check URL parameters for redirected review
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spotId = urlParams.get('spotId');
    const bookingId = urlParams.get('bookingId');
    
    if (spotId && bookingId) {
      setHighlightedBookingId(parseInt(bookingId));
      // Scroll to the booking after reservations are loaded
      setTimeout(() => {
        const element = document.getElementById(`booking-${bookingId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, []);

  // Check if booking can be cancelled (within 5 minutes)
  const canCancelBooking = (booking) => {
    const createdAt = booking.reserved_at;

    if (!createdAt) {
      console.log('No reserved_at time found in booking:', booking);
      return false;
    }

    const bookingTime = new Date(createdAt);
    if (isNaN(bookingTime.getTime())) {
      console.log('Invalid date format:', createdAt);
      return false;
    }

    const currentTime = new Date();
    const timeDifferenceMinutes = (currentTime - bookingTime) / (1000 * 60);
    return timeDifferenceMinutes <= 5;
  };

  // Get remaining time for cancellation
  const getRemainingCancelTime = (booking) => {
    const createdAt = booking.reserved_at;

    if (!createdAt) return null;

    const bookingTime = new Date(createdAt);
    if (isNaN(bookingTime.getTime())) return null;

    const currentTime = new Date();
    const timeDifferenceMinutes = (currentTime - bookingTime) / (1000 * 60);
    const remainingMinutes = Math.max(0, 5 - timeDifferenceMinutes);

    if (remainingMinutes <= 0) return null;

    const minutes = Math.floor(remainingMinutes);
    const seconds = Math.floor((remainingMinutes - minutes) * 60);
    return `${minutes}m ${seconds}s`;
  };

  // Fetch user reservations
  const fetchReservations = () => {
    fetch("http://localhost:5000/api/bookings/my-reservations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reservations");
        return res.json();
      })
      .then((data) => {
        setReservations(data);
      })
      .catch((err) => setMessage(err.message));
  };

  // Check if user can review a parking spot
// Check if user can review a parking spot
  const checkReviewEligibility = (parkingId) => {
    fetch(`http://localhost:5000/reviews/can-review/${parkingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Review eligibility response for parking', parkingId, ':', data);
        setReviewEligibility(prev => ({
          ...prev,
          [parkingId]: data
        }));
      })
      .catch((err) => console.error("Error checking review eligibility:", err));
  };

  // Open review modal
  const openReviewModal = (reservation) => {
    const parkingId = reservation.parking_id || reservation.spot_id;
    setCurrentReview({
      parking_id: parkingId,
      booking_id: reservation.booking_id,
      spot_name: reservation.spot_name,
      rating: 0,
      comment: "",
      cleanliness_rating: 0,
      safety_rating: 0,
      accessibility_rating: 0
    });
    setShowReviewModal(true);
  };

  // Close review modal
  const closeReviewModal = () => {
    setShowReviewModal(false);
    setCurrentReview({
      parking_id: null,
      booking_id: null,
      spot_name: "",
      rating: 0,
      comment: "",
      cleanliness_rating: 0,
      safety_rating: 0,
      accessibility_rating: 0
    });
  };

  // Submit review
  const submitReview = () => {
    if (currentReview.rating === 0) {
      setMessage("Please provide an overall rating");
      return;
    }

    setReviewSubmitting(true);

    fetch("http://localhost:5000/reviews/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        parking_id: currentReview.parking_id,
        booking_id: currentReview.booking_id,
        rating: currentReview.rating,
        comment: currentReview.comment.trim() || null,
        cleanliness_rating: currentReview.cleanliness_rating || null,
        safety_rating: currentReview.safety_rating || null,
        accessibility_rating: currentReview.accessibility_rating || null
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
          closeReviewModal();
          // Refresh review eligibility
          checkReviewEligibility(currentReview.parking_id);
        } else {
          setMessage("Review submitted successfully!");
          closeReviewModal();
          checkReviewEligibility(currentReview.parking_id);
        }
      })
      .catch((err) => {
        setMessage("Failed to submit review: " + err.message);
      })
      .finally(() => {
        setReviewSubmitting(false);
      });
  };

  // Star rating component
  const StarRating = ({ value, onChange, label }) => {
    return (
      <div style={{ marginBottom: "16px" }}>
        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: "500",
          color: "#374151",
          marginBottom: "8px"
        }}>
          {label} {label === "Overall Rating" && <span style={{ color: "#dc2626" }}>*</span>}
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                transition: "transform 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <Star
                style={{
                  width: "32px",
                  height: "32px",
                  fill: star <= value ? "#fbbf24" : "none",
                  stroke: star <= value ? "#fbbf24" : "#d1d5db",
                  strokeWidth: 2
                }}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchReservations();

    // Update remaining time every second for active bookings
    const interval = setInterval(() => {
      setReservations(prev => [...prev]); // Trigger re-render to update times
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (reservations.length > 0) {
      reservations.forEach(reservation => {
        const parkingId = reservation.parking_id || reservation.spot_id;
        if (reservation.status === "expired" && parkingId) {
          checkReviewEligibility(parkingId);
        }
      });
    }
  }, [reservations]);

  // Cancel a booking
  const cancelBooking = (bookingId) => {
    const booking = reservations.find(r => r.booking_id === bookingId);
    if (!canCancelBooking(booking)) {
      setMessage("Cancellation not allowed. You can only cancel within 5 minutes of booking.");
      return;
    }
    setBookingToCancel(bookingId);
    setShowConfirmModal(true);
  };

  const confirmCancellation = () => {
    fetch(`http://localhost:5000/api/bookings/cancel/${bookingToCancel}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message || "Reservation cancelled");
        fetchReservations();
        setShowConfirmModal(false);
        setBookingToCancel(null);
      })
      .catch(() => {
        setMessage("Cancellation failed");
        setShowConfirmModal(false);
        setBookingToCancel(null);
      });
  };

  const getStatusStyle = (status) => {
    const baseStyle = {
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      border: "1px solid",
      textTransform: "capitalize"
    };

    switch (status) {
      case "active":
        return { ...baseStyle, backgroundColor: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" };
      case "cancelled":
        return { ...baseStyle, backgroundColor: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" };
      case "expired":
        return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#374151", borderColor: "#d1d5db" };
      case "completed":
        return { ...baseStyle, backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#dbeafe" };
      default:
        return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#374151", borderColor: "#d1d5db" };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle style={{ width: "16px", height: "16px" }} />;
      case "cancelled":
        return <X style={{ width: "16px", height: "16px" }} />;
      default:
        return <AlertCircle style={{ width: "16px", height: "16px" }} />;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #faf5ff 100%)"
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        borderBottom: "1px solid #e5e7eb"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#111827",
              margin: 0
            }}>My Reservations</h1>
            <span style={{
              backgroundColor: "#dbeafe",
              color: "#1d4ed8",
              fontSize: "14px",
              fontWeight: "500",
              padding: "4px 12px",
              borderRadius: "20px"
            }}>
              {reservations.length} {reservations.length === 1 ? 'Reservation' : 'Reservations'}
            </span>
          </div>
          <a
            href="/user/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#2563eb",
              color: "white",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: "500",
              textDecoration: "none",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              transition: "all 0.2s ease",
              cursor: "pointer"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#1d4ed8";
              e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
              e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            <span>Go to Map</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px 24px"
      }}>
        {/* Message Display */}
        {message && (
          <div style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: message.includes("failed") || message.includes("error") ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${message.includes("failed") || message.includes("error") ? "#fecaca" : "#bbf7d0"}`,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            {message.includes("failed") || message.includes("error") ? (
              <AlertCircle style={{ width: "20px", height: "20px", color: "#dc2626", flexShrink: 0 }} />
            ) : (
              <CheckCircle style={{ width: "20px", height: "20px", color: "#16a34a", flexShrink: 0 }} />
            )}
            <p style={{ 
              color: message.includes("failed") || message.includes("error") ? "#dc2626" : "#166534", 
              fontWeight: "500", 
              margin: 0, 
              flex: 1 
            }}>{message}</p>
            <button
              onClick={() => setMessage("")}
              style={{
                background: "none",
                border: "none",
                color: message.includes("failed") || message.includes("error") ? "#dc2626" : "#16a34a",
                cursor: "pointer",
                padding: "4px"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = message.includes("failed") || message.includes("error") ? "#b91c1c" : "#15803d"}
              onMouseOut={(e) => e.currentTarget.style.color = message.includes("failed") || message.includes("error") ? "#dc2626" : "#16a34a"}
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        )}

        {/* Reservations List */}
        {reservations.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: "64px", paddingBottom: "64px" }}>
            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              border: "1px solid #e5e7eb",
              padding: "48px",
              maxWidth: "400px",
              margin: "0 auto"
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#f3f4f6",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto"
              }}>
                <Calendar style={{ width: "32px", height: "32px", color: "#9ca3af" }} />
              </div>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 8px 0"
              }}>No reservations yet</h3>
              <p style={{
                color: "#6b7280",
                margin: "0 0 24px 0"
              }}>Start by exploring available parking spots on the map.</p>
              <a
                href="/user/dashboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "500",
                  textDecoration: "none",
                  transition: "background-color 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1d4ed8"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
              >
                <MapPin style={{ width: "16px", height: "16px" }} />
                <span>Find Parking</span>
              </a>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "24px" }}>
            {reservations.map((r) => {
              const canCancel = canCancelBooking(r);
              const remainingTime = getRemainingCancelTime(r);
              const parkingId = r.parking_id || r.spot_id;
              const eligibility = reviewEligibility[parkingId];
              const isHighlighted = highlightedBookingId === r.booking_id;
              

              return (
                <div
                  key={r.booking_id}
                  id={`booking-${r.booking_id}`}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    boxShadow: isHighlighted ? "0 0 0 3px #fbbf24" : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    border: isHighlighted ? "2px solid #fbbf24" : "1px solid #e5e7eb",
                    overflow: "hidden",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div style={{ padding: "24px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: "16px"
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: "20px",
                          fontWeight: "600",
                          color: "#111827",
                          margin: "0 0 16px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <MapPin style={{ width: "20px", height: "20px", color: "#2563eb" }} />
                          <span>{r.spot_name}</span>
                        </h3>

                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "16px",
                          marginBottom: "16px"
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#6b7280"
                          }}>
                            <Clock style={{ width: "16px", height: "16px" }} />
                            <span style={{ fontSize: "14px" }}>Duration: {r.duration_hours}h</span>
                          </div>

                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#6b7280"
                          }}>
                            <span style={{ fontSize: "14px", fontWeight: "500" }}>
                              Total: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(r.total_price)}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={getStatusStyle(r.status)}>
                              {getStatusIcon(r.status)}
                              <span>{r.status}</span>
                            </span>
                          </div>
                        </div>

                        {/* Cancellation Timer */}
                        {r.status === "active" && remainingTime && (
                          <div style={{
                            backgroundColor: "#fef3c7",
                            border: "1px solid #fde68a",
                            borderRadius: "8px",
                            padding: "12px",
                            marginBottom: "16px"
                          }}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color: "#92400e"
                            }}>
                              <Clock style={{ width: "16px", height: "16px" }} />
                              <span style={{ fontSize: "14px", fontWeight: "500" }}>
                                Cancellation available for: {remainingTime}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      paddingTop: "16px",
                      borderTop: "1px solid #f3f4f6",
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap"
                    }}>
                      {/* Cancel Button for Active Bookings */}
                      {r.status === "active" && (
                        canCancel ? (
                          <button
                            onClick={() => cancelBooking(r.booking_id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              backgroundColor: "#fef2f2",
                              color: "#dc2626",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontWeight: "500",
                              border: "1px solid #fecaca",
                              cursor: "pointer",
                              transition: "background-color 0.2s ease"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                          >
                            <X style={{ width: "16px", height: "16px" }} />
                            <span>Cancel Reservation</span>
                          </button>
                        ) : (
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "#f9fafb",
                            color: "#6b7280",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontWeight: "500",
                            border: "1px solid #d1d5db"
                          }}>
                            <X style={{ width: "16px", height: "16px" }} />
                            <span>Cancellation period expired</span>
                          </div>
                        )
                      )}

{/* Review Button for Expired Bookings */}
                      {r.status === "expired" && parkingId && (
                        !eligibility ? (
                          // Loading state - show placeholder button
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "#f3f4f6",
                            color: "#6b7280",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontWeight: "500",
                            border: "1px solid #d1d5db"
                          }}>
                            <Star style={{ width: "16px", height: "16px" }} />
                            <span>Checking review status...</span>
                          </div>
                        ) : eligibility.canReview ? (
                            <button
                              onClick={() => openReviewModal(r)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontWeight: "500",
                                border: "1px solid #fde68a",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "#fde68a";
                                e.currentTarget.style.transform = "translateY(-1px)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = "#fef3c7";
                                e.currentTarget.style.transform = "translateY(0)";
                              }}
                            >
                              <Star style={{ width: "16px", height: "16px" }} />
                              <span>Write a Review</span>
                            </button>
                          ) : (
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              backgroundColor: "#f0fdf4",
                              color: "#166534",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontWeight: "500",
                              border: "1px solid #bbf7d0"
                            }}>
                              <CheckCircle style={{ width: "16px", height: "16px" }} />
                              <span>{eligibility.reason === "already_reviewed" ? "Already Reviewed" : "Review Not Available"}</span>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#fef2f2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto"
              }}>
                <AlertCircle style={{ width: "32px", height: "32px", color: "#dc2626" }} />
              </div>

              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 8px 0"
              }}>Cancel Reservation</h3>

              <p style={{
                color: "#6b7280",
                margin: "0 0 24px 0",
                lineHeight: "1.5"
              }}>
                Are you sure you want to cancel this reservation? This action cannot be undone.
              </p>

              <div style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center"
              }}>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setBookingToCancel(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontWeight: "500",
                    color: "#374151",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#9ca3af";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                >
                  Keep Reservation
                </button>

                <button
                  onClick={confirmCancellation}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#dc2626",
                    border: "1px solid #dc2626",
                    borderRadius: "8px",
                    fontWeight: "500",
                    color: "white",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#b91c1c";
                    e.currentTarget.style.borderColor = "#b91c1c";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#dc2626";
                    e.currentTarget.style.borderColor = "#dc2626";
                  }}
                >
                  Yes, Cancel It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Review Modal */}
      {showReviewModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
          backdropFilter: "blur(4px)",
          overflowY: "auto",
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "24px",
              borderBottom: "1px solid #e5e7eb",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "white"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    margin: "0 0 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <Star style={{ width: "28px", height: "28px" }} />
                    Write a Review
                  </h3>
                  <p style={{ fontSize: "14px", opacity: 0.9, margin: 0 }}>
                    Share your experience at {currentReview.spot_name}
                  </p>
                </div>
                <button
                  onClick={closeReviewModal}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"}
                >
                  <X style={{ width: "24px", height: "24px" }} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px"
            }}>
              {/* Overall Rating */}
              <StarRating
                value={currentReview.rating}
                onChange={(value) => setCurrentReview({ ...currentReview, rating: value })}
                label="Overall Rating"
              />

              {/* Comment */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  Your Review (Optional)
                </label>
                <textarea
                  value={currentReview.comment}
                  onChange={(e) => setCurrentReview({ ...currentReview, comment: e.target.value })}
                  placeholder="Share details about your parking experience..."
                  maxLength={1000}
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    outline: "none",
                    transition: "border-color 0.2s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                  onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                />
                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "4px"
                }}>
                  <span style={{
                    fontSize: "12px",
                    color: "#6b7280"
                  }}>
                    {currentReview.comment.length}/1000 characters
                  </span>
                </div>
              </div>

              {/* Additional Ratings */}
              <div style={{
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e5e7eb",
                marginBottom: "16px"
              }}>
                <h4 style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 16px"
                }}>
                  Additional Ratings (Optional)
                </h4>

                <StarRating
                  value={currentReview.cleanliness_rating}
                  onChange={(value) => setCurrentReview({ ...currentReview, cleanliness_rating: value })}
                  label="Cleanliness"
                />

                <StarRating
                  value={currentReview.safety_rating}
                  onChange={(value) => setCurrentReview({ ...currentReview, safety_rating: value })}
                  label="Safety"
                />

                <StarRating
                  value={currentReview.accessibility_rating}
                  onChange={(value) => setCurrentReview({ ...currentReview, accessibility_rating: value })}
                  label="Accessibility"
                />
              </div>

              {/* Info Banner */}
              <div style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #dbeafe",
                borderRadius: "8px",
                padding: "12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px"
              }}>
                <AlertCircle style={{ 
                  width: "20px", 
                  height: "20px", 
                  color: "#2563eb", 
                  flexShrink: 0,
                  marginTop: "2px"
                }} />
                <p style={{
                  fontSize: "13px",
                  color: "#1e40af",
                  margin: 0,
                  lineHeight: "1.5"
                }}>
                  Your review helps other users make informed decisions and helps parking owners improve their services.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "24px",
              borderTop: "1px solid #e5e7eb",
              background: "#f9fafb",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={closeReviewModal}
                disabled={reviewSubmitting}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: reviewSubmitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: reviewSubmitting ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (!reviewSubmitting) {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#9ca3af";
                  }
                }}
                onMouseOut={(e) => {
                  if (!reviewSubmitting) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }
                }}
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                disabled={reviewSubmitting || currentReview.rating === 0}
                style={{
                  padding: "10px 24px",
                  backgroundColor: currentReview.rating === 0 ? "#9ca3af" : "#2563eb",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "500",
                  color: "white",
                  cursor: (reviewSubmitting || currentReview.rating === 0) ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseOver={(e) => {
                  if (!reviewSubmitting && currentReview.rating !== 0) {
                    e.currentTarget.style.backgroundColor = "#1d4ed8";
                  }
                }}
                onMouseOut={(e) => {
                  if (!reviewSubmitting && currentReview.rating !== 0) {
                    e.currentTarget.style.backgroundColor = "#2563eb";
                  }
                }}
              >
                {reviewSubmitting ? (
                  <>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #ffffff",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle style={{ width: "16px", height: "16px" }} />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        textarea::-webkit-scrollbar {
          width: 8px;
        }

        textarea::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        textarea::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        textarea::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default UserReservations;
      