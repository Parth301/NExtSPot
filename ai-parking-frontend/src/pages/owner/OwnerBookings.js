import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar, IndianRupee, MapPin, User, Users, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/api/spots/owner/bookings", { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then((res) => res.json())
      .then(setBookings)
      .catch(() => setMessage("Failed to fetch bookings"));

    fetch("http://localhost:5000/api/system/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setMessage("Failed to fetch stats"));
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} />;
      case 'expired':
        return <XCircle size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <a href="/owner/dashboard" style={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </a>
          <div style={styles.headerText}>
            <h1 style={styles.title}>Booking Management</h1>
            <p style={styles.subtitle}>Monitor and manage your parking spot bookings</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Message Display */}
        {message && (
          <div style={styles.messageBox}>
            <AlertCircle size={20} />
            <span>{message}</span>
          </div>
        )}

        {/* Statistics Cards */}
        <section style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>Overview</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{...styles.statIcon, backgroundColor: '#e3f2fd'}}>
                  <MapPin size={24} color="#1976d2" />
                </div>
                <div>
                  <p style={styles.statLabel}>Total Spots</p>
                  <p style={styles.statValue}>{stats.total_spots || 0}</p>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{...styles.statIcon, backgroundColor: '#e8f5e8'}}>
                  <CheckCircle size={24} color="#388e3c" />
                </div>
                <div>
                  <p style={styles.statLabel}>Available</p>
                  <p style={{...styles.statValue, color: '#388e3c'}}>{stats.available_spots || 0}</p>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{...styles.statIcon, backgroundColor: '#fff3e0'}}>
                  <Clock size={24} color="#f57c00" />
                </div>
                <div>
                  <p style={styles.statLabel}>Reserved</p>
                  <p style={{...styles.statValue, color: '#f57c00'}}>{stats.reserved_spots || 0}</p>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{...styles.statIcon, backgroundColor: '#ffebee'}}>
                  <XCircle size={24} color="#d32f2f" />
                </div>
                <div>
                  <p style={styles.statLabel}>Unavailable</p>
                  <p style={{...styles.statValue, color: '#d32f2f'}}>{stats.unavailable_spots || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bookings Section */}
        <section style={styles.bookingsSection}>
          <div style={styles.bookingsHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Recent Bookings</h2>
              <p style={styles.sectionSubtitle}>Manage your parking spot reservations</p>
            </div>
            <div style={styles.bookingsCount}>
              <Users size={20} />
              <span>{bookings.length} bookings</span>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div style={styles.emptyState}>
              <Calendar size={48} color="#9e9e9e" />
              <h3 style={styles.emptyTitle}>No bookings yet</h3>
              <p style={styles.emptyText}>Your booking history will appear here once customers start reserving your spots.</p>
            </div>
          ) : (
            <div style={styles.bookingsContainer}>
              {bookings.map((booking) => (
                <div key={booking.booking_id} style={styles.bookingCard}>
                  <div style={styles.bookingHeader}>
                    <div style={styles.spotInfo}>
                      <div style={styles.spotIcon}>
                        <MapPin size={24} color="#1976d2" />
                      </div>
                      <div style={styles.spotDetails}>
                        <h4 style={styles.spotName}>{booking.spot_name}</h4>
                        <div style={styles.customerInfo}>
                          <User size={14} />
                          <span>{booking.user_name}</span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.bookingStatus}>
                      <span style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(booking.status)
                      }}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div style={styles.bookingDetails}>
                    <div style={styles.detailItem}>
                      <label style={styles.detailLabel}>Customer Email</label>
                      <span style={styles.detailValue}>{booking.user_email}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <label style={styles.detailLabel}>Amount</label>
                      <span style={{
                        ...styles.detailValue,
                        ...styles.price,
                        fontSize: '1.125rem',
                        fontWeight: '700'
                      }}>
                        <IndianRupee size={16} />
                        {booking.total_price}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <label style={styles.detailLabel}>Expires At</label>
                      <span style={styles.detailValue}>
                        {new Date(booking.expires_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const getStatusStyle = (status) => {
  switch (status) {
    case 'active':
      return { backgroundColor: '#e8f5e8', color: '#2e7d32', borderColor: '#4caf50' };
    case 'expired':
      return { backgroundColor: '#ffebee', color: '#c62828', borderColor: '#f44336' };
    case 'completed':
      return { backgroundColor: '#e3f2fd', color: '#1565c0', borderColor: '#2196f3' };
    default:
      return { backgroundColor: '#fff3e0', color: '#ef6c00', borderColor: '#ff9800' };
  }
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.25rem 0'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  messageBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    marginBottom: '1.5rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#b91c1c'
  },
  statsSection: {
    marginBottom: '2rem'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1rem'
  },
  sectionSubtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem'
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  statIcon: {
    padding: '0.75rem',
    borderRadius: '8px'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: '0 0 0.25rem 0'
  },
  statValue: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  bookingsSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  bookingsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb'
  },
  bookingsCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#6b7280',
    fontSize: '0.875rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280'
  },
  emptyTitle: {
    fontSize: '1.125rem',
    fontWeight: '500',
    color: '#1f2937',
    margin: '1rem 0 0.5rem 0'
  },
  emptyText: {
    margin: 0
  },
  bookingsContainer: {
    padding: '1rem'
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #f3f4f6'
  },
  spotInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    flex: 1
  },
  spotIcon: {
    padding: '0.75rem',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    flexShrink: 0
  },
  spotDetails: {
    flex: 1
  },
  spotName: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 0.5rem 0',
    lineHeight: 1.3
  },
  customerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    width: 'fit-content'
  },
  bookingStatus: {
    display: 'flex',
    alignItems: 'flex-start',
    flexShrink: 0
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    border: '1px solid',
    textTransform: 'capitalize',
    minWidth: '100px',
    justifyContent: 'center'
  },
  bookingDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '2rem',
    alignItems: 'center'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem'
  },
  detailLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  detailValue: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#1f2937'
  },
  price: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#059669',
    fontWeight: '700'
  }
};

export default OwnerBookings;