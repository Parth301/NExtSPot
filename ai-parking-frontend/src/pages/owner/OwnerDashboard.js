import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Plus, MapPin, DollarSign, Clock, Eye, EyeOff, Trash2, RotateCcw, Navigation, Activity, AlertTriangle, X, LogOut } from "lucide-react";

// Map click handler component
function MapClickHandler({ onMapClick, isAddingMode }) {
  useMapEvents({
    click: (e) => {
      if (isAddingMode) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

function OwnerDashboard() {
  const [spots, setSpots] = useState([]);
  const [newSpot, setNewSpot] = useState({ name: "", latitude: "", longitude: "", price: "", type: "" });
  const [message, setMessage] = useState("");
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [spotToDelete, setSpotToDelete] = useState(null);
  const token = localStorage.getItem("token");

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/home";
  };

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log("Location access denied");
        }
      );
    }
  }, []);

  // Fetch owner's spots
  const fetchSpots = () => {
    fetch("http://localhost:5000/api/spots/owner", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const uniqueSpots = Array.from(new Map(data.map(item => [item.id, item])).values());
        setSpots(uniqueSpots);
        setLastRefresh(new Date());
      })
      .catch(err => setMessage(err.message));
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchSpots();
    const interval = setInterval(fetchSpots, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle map click for adding new spot
  const handleMapClick = (latlng) => {
    setNewSpot({
      ...newSpot,
      latitude: latlng.lat.toFixed(6),
      longitude: latlng.lng.toFixed(6)
    });
    setIsAddingMode(false);
    setMessage("Location selected! Fill in the remaining details.");
  };

  // Add new spot
  const addSpot = () => {
    if (!newSpot.name || !newSpot.latitude || !newSpot.longitude || !newSpot.price || !newSpot.type) {
      setMessage("Please fill in all fields");
      return;
    }

    const payload = {
      ...newSpot,
      latitude: parseFloat(newSpot.latitude),
      longitude: parseFloat(newSpot.longitude),
      price: parseFloat(newSpot.price),
    };

    fetch("http://localhost:5000/api/spots/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message || "Spot added successfully!");
        fetchSpots();
        setNewSpot({ name: "", latitude: "", longitude: "", price: "", type: "" });
      })
      .catch(() => setMessage("Failed to add spot"));
  };

  // Toggle availability
  const toggleAvailability = (id, current) => {
    const is_available = Number(!current);
    fetch(`http://localhost:5000/api/spots/${id}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_available }),
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        fetchSpots();
      })
      .catch(() => setMessage("Failed to toggle availability"));
  };

  // Remove spot
  const removeSpot = (id) => {
    setSpotToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (spotToDelete) {
      fetch(`http://localhost:5000/api/spots/${spotToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setMessage(data.message);
          fetchSpots();
        })
        .catch(() => setMessage("Failed to remove spot"));
    }
    setShowDeleteDialog(false);
    setSpotToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setSpotToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#22C55E';
      case 'reserved': return '#F59E0B';
      case 'occupied': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'available': return '#DCFCE7';
      case 'reserved': return '#FEF3C7';
      case 'occupied': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  // Create custom map icons for different spot statuses
  const createCustomIcon = (status) => {
    let color, bgColor, borderColor;
    
    switch (status) {
      case 'available':
        color = '#FFFFFF';
        bgColor = '#22C55E';
        borderColor = '#16A34A';
        break;
      case 'reserved':
        color = '#FFFFFF';
        bgColor = '#F59E0B';
        borderColor = '#D97706';
        break;
      case 'occupied':
        color = '#FFFFFF';
        bgColor = '#EF4444';
        borderColor = '#DC2626';
        break;
      default:
        color = '#FFFFFF';
        bgColor = '#6B7280';
        borderColor = '#4B5563';
    }

    return L.divIcon({
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${bgColor};
          border: 3px solid ${borderColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          position: relative;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: ${color};
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: 'custom-spot-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#1E293B',
            letterSpacing: '-0.025em'
          }}>Parking Management</h1>
          <div style={{
            margin: '4px 0 0 0',
            color: '#64748B',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Activity size={14} />
            Last updated: {lastRefresh.toLocaleTimeString()}
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              backgroundColor: '#22C55E',
              borderRadius: '50%',
              marginLeft: '8px'
            }}></span>
            <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: '500' }}>Live</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              background: '#FFFFFF',
              color: '#EF4444',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#FEF2F2';
              e.target.style.borderColor = '#F87171';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#FFFFFF';
              e.target.style.borderColor = '#FCA5A5';
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
          <button
            onClick={fetchSpots}
            style={{
              background: '#FFFFFF',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#F9FAFB';
              e.target.style.borderColor = '#9CA3AF';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#FFFFFF';
              e.target.style.borderColor = '#D1D5DB';
            }}
          >
            <RotateCcw size={14} />
            Refresh
          </button>
          <a 
            href="/owner/bookings" 
            style={{
              background: '#1E293B',
              color: '#FFFFFF',
              textDecoration: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0F172A'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1E293B'}
          >
            View Bookings
          </a>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', gap: '24px', height: 'calc(100vh - 88px)' }}>
        {/* Left Panel */}
        <div style={{
          width: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Message Display */}
          {message && (
            <div style={{
              background: message.toLowerCase().includes("cannot") || message.toLowerCase().includes("failed") 
                ? '#FEF2F2' 
                : '#F0FDF4',
              color: message.toLowerCase().includes("cannot") || message.toLowerCase().includes("failed") 
                ? '#DC2626' : '#16A34A',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              border: `1px solid ${message.toLowerCase().includes("cannot") || message.toLowerCase().includes("failed") 
                ? '#FECACA' : '#BBF7D0'}`,
              animation: 'slideIn 0.3s ease-out'
            }}>
              {message}
            </div>
          )}

          {/* Add Spot Form */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #E2E8F0'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Plus size={18} style={{ color: '#64748B' }} />
              Add New Parking Spot
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>Spot Name</label>
                <input
                  placeholder="Enter spot name"
                  value={newSpot.name}
                  onChange={e => setNewSpot({ ...newSpot, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s ease',
                    outline: 'none',
                    background: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>Latitude</label>
                  <input
                    placeholder="0.000000"
                    value={newSpot.latitude}
                    onChange={e => setNewSpot({ ...newSpot, latitude: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>Longitude</label>
                  <input
                    placeholder="0.000000"
                    value={newSpot.longitude}
                    onChange={e => setNewSpot({ ...newSpot, longitude: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  />
                </div>
              </div>

              <button
                onClick={() => setIsAddingMode(!isAddingMode)}
                style={{
                  padding: '10px 16px',
                  background: isAddingMode ? '#FFFFFF' : '#F8FAFC',
                  color: isAddingMode ? '#DC2626' : '#374151',
                  border: `1px solid ${isAddingMode ? '#FCA5A5' : '#D1D5DB'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (isAddingMode) {
                    e.target.style.backgroundColor = '#FEF2F2';
                  } else {
                    e.target.style.backgroundColor = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isAddingMode) {
                    e.target.style.backgroundColor = '#FFFFFF';
                  } else {
                    e.target.style.backgroundColor = '#F8FAFC';
                  }
                }}
              >
                <MapPin size={14} />
                {isAddingMode ? 'Cancel Map Selection' : 'Select Location on Map'}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>Price/Hour</label>
                  <input
                    placeholder="0.00"
                    value={newSpot.price}
                    onChange={e => setNewSpot({ ...newSpot, price: e.target.value })}
                    type="number"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>Type</label>
                  <input
                    placeholder="e.g., Covered, Open"
                    value={newSpot.type}
                    onChange={e => setNewSpot({ ...newSpot, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  />
                </div>
              </div>

              <button
                onClick={addSpot}
                style={{
                  padding: '12px 16px',
                  background: '#1E293B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0F172A'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#1E293B'}
              >
                <Plus size={16} />
                Add Parking Spot
              </button>
            </div>
          </div>

          {/* Stats Panel */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #E2E8F0'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1E293B'
            }}>
              Overview
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <span style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>Total Spots</span>
                <span style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  color: '#1E293B',
                  background: '#F8FAFC',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  minWidth: '24px',
                  textAlign: 'center'
                }}>{spots.length}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#22C55E',
                    borderRadius: '50%'
                  }}></div>
                  <span style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>Available</span>
                </div>
                <span style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  color: '#22C55E',
                  background: '#DCFCE7',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  minWidth: '24px',
                  textAlign: 'center'
                }}>
                  {spots.filter(spot => spot.status === 'available').length}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#F59E0B',
                    borderRadius: '50%'
                  }}></div>
                  <span style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>Reserved</span>
                </div>
                <span style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  color: '#F59E0B',
                  background: '#FEF3C7',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  minWidth: '24px',
                  textAlign: 'center'
                }}>
                  {spots.filter(spot => spot.status === 'reserved').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #E2E8F0',
          position: 'relative'
        }}>
          {isAddingMode && (
            <div style={{
              position: 'absolute',
              top: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1E293B',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <MapPin size={14} />
              Click on map to select location
            </div>
          )}

          <div style={{ height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer 
              center={userLocation || [20, 77]} 
              zoom={userLocation ? 15 : 5} 
              minZoom={3}
              maxZoom={18}
              worldCopyJump={true}
              maxBounds={[[-85, -180], [85, 180]]}
              maxBoundsOptions={{ animate: true, duration: 0.25, padding: [20, 20] }}
              style={{ 
                height: '100%', 
                width: '100%',
                borderRadius: '8px',
                border: 'none',
                cursor: isAddingMode ? 'crosshair' : 'default'
              }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapClickHandler onMapClick={handleMapClick} isAddingMode={isAddingMode} />
              
              {spots.map(spot => (
                <Marker 
                  key={spot.id} 
                  position={[spot.latitude, spot.longitude]}
                  icon={createCustomIcon(spot.status)}
                >
                  <Popup>
                    <div style={{ minWidth: '240px', padding: '4px' }}>
                      <div style={{
                        marginBottom: '16px',
                        color: '#374151',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        ${spot.price}/hour
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => toggleAvailability(spot.id, spot.is_available)}
                          disabled={spot.status === "reserved"}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: spot.status === "reserved" 
                              ? '#F3F4F6' 
                              : spot.is_available 
                                ? '#FFFFFF' 
                                : '#F8FAFC',
                            color: spot.status === "reserved" 
                              ? '#9CA3AF' 
                              : spot.is_available 
                                ? '#EF4444' 
                                : '#22C55E',
                            border: spot.status === "reserved" 
                              ? '1px solid #D1D5DB' 
                              : spot.is_available 
                                ? '1px solid #FCA5A5' 
                                : '1px solid #BBF7D0',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: spot.status === "reserved" ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {spot.is_available ? <EyeOff size={12} /> : <Eye size={12} />}
                          {spot.is_available ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => removeSpot(spot.id)}
                          style={{
                            padding: '8px 12px',
                            background: '#FFFFFF',
                            color: '#EF4444',
                            border: '1px solid #FCA5A5',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#FEF2F2'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E2E8F0',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={24} style={{ color: '#EF4444' }} />
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1E293B'
                }}>Delete Parking Spot</h3>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: '#64748B'
                }}>This action cannot be undone</p>
              </div>
            </div>

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5'
            }}>
              Are you sure you want to permanently delete this parking spot? This will remove all associated data and cannot be reversed.
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '10px 16px',
                  background: '#FFFFFF',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#F9FAFB';
                  e.target.style.borderColor = '#9CA3AF';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#FFFFFF';
                  e.target.style.borderColor = '#D1D5DB';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '10px 16px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
              >
                Delete Spot
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

export default OwnerDashboard;