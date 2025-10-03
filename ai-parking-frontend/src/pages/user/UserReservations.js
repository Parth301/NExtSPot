import React, { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, MapPin, ArrowLeft, X, CheckCircle, AlertCircle } from "lucide-react";

function UserReservations() {
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const token = localStorage.getItem("token");

  // Check if booking can be cancelled (within 5 minutes)
  const canCancelBooking = (booking) => {
    // Use reserved_at field as that's what your backend uses
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
      .then((data) => setReservations(data))
      .catch((err) => setMessage(err.message));
  };

  useEffect(() => {
    fetchReservations();
    
    // Update remaining time every second for active bookings
    const interval = setInterval(() => {
      setReservations(prev => [...prev]); // Trigger re-render to update times
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

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
        fetchReservations(); // Refresh after cancel
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
              e.target.style.backgroundColor = "#1d4ed8";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#2563eb";
              e.target.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
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
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <CheckCircle style={{ width: "20px", height: "20px", color: "#16a34a", flexShrink: 0 }} />
            <p style={{ color: "#166534", fontWeight: "500", margin: 0, flex: 1 }}>{message}</p>
            <button 
              onClick={() => setMessage("")}
              style={{
                background: "none",
                border: "none",
                color: "#16a34a",
                cursor: "pointer",
                padding: "4px"
              }}
              onMouseOver={(e) => e.target.style.color = "#15803d"}
              onMouseOut={(e) => e.target.style.color = "#16a34a"}
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
                onMouseOver={(e) => e.target.style.backgroundColor = "#1d4ed8"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#2563eb"}
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
              
              return (
                <div 
                  key={r.booking_id} 
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e5e7eb",
                    overflow: "hidden"
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
                            <DollarSign style={{ width: "16px", height: "16px" }} />
                            <span style={{ fontSize: "14px", fontWeight: "500" }}>Total: ${r.total_price}</span>
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
                    
                    {r.status === "active" && (
                      <div style={{
                        paddingTop: "16px",
                        borderTop: "1px solid #f3f4f6"
                      }}>
                        {canCancel ? (
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
                            onMouseOver={(e) => e.target.style.backgroundColor = "#fee2e2"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "#fef2f2"}
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
                        )}
                      </div>
                    )}
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
                    e.target.style.backgroundColor = "#f3f4f6";
                    e.target.style.borderColor = "#9ca3af";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = "#f9fafb";
                    e.target.style.borderColor = "#d1d5db";
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
                    e.target.style.backgroundColor = "#b91c1c";
                    e.target.style.borderColor = "#b91c1c";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = "#dc2626";
                    e.target.style.borderColor = "#dc2626";
                  }}
                >
                  Yes, Cancel It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserReservations;