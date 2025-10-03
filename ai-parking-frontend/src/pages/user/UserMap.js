import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Component to handle routing
function RoutingController({ userLocation, destination, onRouteFound, onRouteClear }) {
  const map = useMap();
  const routingControlRef = useRef(null);
  const isActiveRef = useRef(false);
  const currentDestinationRef = useRef(null);

  // Completely avoid the problematic removeControl/removeLayer calls
  const clearRoute = () => {
    if (routingControlRef.current && map) {
      try {
        // Instead of removing, just hide and disable the routing control
        if (routingControlRef.current.getContainer) {
          const container = routingControlRef.current.getContainer();
          if (container && container.style) {
            container.style.display = 'none';
          }
        }
        
        // Clear waypoints instead of removing control
        if (routingControlRef.current.setWaypoints) {
          routingControlRef.current.setWaypoints([]);
        }
      } catch (error) {
        // Even this might fail, so just ignore silently
      }
    }
    isActiveRef.current = false;
    currentDestinationRef.current = null;
  };

  useEffect(() => {
    if (!destination || !userLocation || !map) {
      clearRoute();
      onRouteClear();
      return;
    }

    // Check if destination actually changed to avoid unnecessary re-routing
    const destinationKey = `${destination.lat}-${destination.lng}`;
    if (currentDestinationRef.current === destinationKey && isActiveRef.current) {
      return; // Don't recreate route if it's the same destination and already active
    }

    currentDestinationRef.current = destinationKey;

    // Only create a new routing control if we don't have one
    if (!routingControlRef.current) {
      // Load Leaflet Routing Machine if needed
      if (!window.L || !window.L.Routing) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js';
        
        script.onload = () => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.css';
          document.head.appendChild(link);
          setTimeout(createRoutingControl, 500);
        };
        
        script.onerror = () => onRouteFound('Routing unavailable');
        document.head.appendChild(script);
      } else {
        setTimeout(createRoutingControl, 200);
      }
    } else {
      // Reuse existing control, just update waypoints
      updateWaypoints();
    }

    function createRoutingControl() {
      if (!window.L || !window.L.Routing || !map || routingControlRef.current) return;

      try {
        routingControlRef.current = window.L.Routing.control({
          waypoints: [
            L.latLng(userLocation[0], userLocation[1]),
            L.latLng(destination.lat, destination.lng)
          ],
          routeWhileDragging: false,
          addWaypoints: false,
          createMarker: () => null,
          lineOptions: {
            styles: [{ color: '#2563eb', weight: 4, opacity: 0.8 }]
          },
          show: false,
          collapsible: true,
          router: window.L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'driving'
          })
        });

        routingControlRef.current.on('routesfound', handleRouteFound);
        routingControlRef.current.on('routingerror', handleRouteError);

        // Add to map only once
        if (map && map.addControl) {
          map.addControl(routingControlRef.current);
          isActiveRef.current = true;
          
          // Show the container
          setTimeout(() => {
            if (routingControlRef.current && routingControlRef.current.getContainer) {
              const container = routingControlRef.current.getContainer();
              if (container && container.style) {
                container.style.display = 'block';
              }
            }
          }, 100);
        }
      } catch (error) {
        console.error('Failed to create routing control:', error);
        onRouteFound('Routing failed');
      }
    }

    function updateWaypoints() {
      if (routingControlRef.current && routingControlRef.current.setWaypoints) {
        try {
          routingControlRef.current.setWaypoints([
            L.latLng(userLocation[0], userLocation[1]),
            L.latLng(destination.lat, destination.lng)
          ]);
          
          // Show the container
          if (routingControlRef.current.getContainer) {
            const container = routingControlRef.current.getContainer();
            if (container && container.style) {
              container.style.display = 'block';
            }
          }
          
          isActiveRef.current = true;
        } catch (error) {
          console.warn('Failed to update waypoints:', error);
          onRouteFound('Route update failed');
        }
      }
    }

    function handleRouteFound(e) {
      try {
        const routes = e.routes;
        if (routes && routes[0] && routes[0].summary) {
          const summary = routes[0].summary;
          const distance = (summary.totalDistance / 1000).toFixed(1);
          const time = Math.round(summary.totalTime / 60);
          onRouteFound(`${distance} km • ${time} min`);
        } else {
          onRouteFound('Route calculated');
        }
      } catch (err) {
        onRouteFound('Route found');
      }
    }

    function handleRouteError(e) {
      console.warn('Routing error:', e);
      onRouteFound('Route unavailable');
    }

    // Don't cleanup on every effect run
    return () => {
      // Only clear if destination is actually being removed, not just changed
      if (!destination) {
        clearRoute();
      }
    };
  }, [userLocation, destination, map, onRouteFound, onRouteClear]);

  // Handle clearing when destination is removed
  useEffect(() => {
    if (!destination && isActiveRef.current) {
      clearRoute();
      onRouteClear();
    }
  }, [destination, onRouteClear]);

  return null;
}

// Component to handle map updates
function MapController({ userLocation, initialSpots, hasInitialized, hasActiveRoute, shouldClosePopups, onPopupsClosed }) {
  const map = useMap();
  const initialViewSetRef = useRef(false);

  useEffect(() => {
    if (!hasInitialized || hasActiveRoute || initialViewSetRef.current || !map) return;
    
    setTimeout(() => {
      try {
        if (userLocation && initialSpots.length > 0) {
          const bounds = L.latLngBounds([userLocation, ...initialSpots.map(spot => [spot.latitude, spot.longitude])]);
          map.fitBounds(bounds, { padding: [40, 40] });
          initialViewSetRef.current = true;
        } else if (userLocation) {
          map.setView(userLocation, 15);
          initialViewSetRef.current = true;
        }
      } catch (error) {
        console.warn('Error setting initial map view:', error);
      }
    }, 100);
  }, [map, hasInitialized, hasActiveRoute, userLocation, initialSpots]);

  useEffect(() => {
    if (!hasActiveRoute) {
      initialViewSetRef.current = false;
    }
  }, [hasActiveRoute]);

  useEffect(() => {
    if (shouldClosePopups && onPopupsClosed && map) {
      try {
        map.closePopup();
        onPopupsClosed();
      } catch (error) {
        console.warn('Error closing popups:', error);
        onPopupsClosed();
      }
    }
  }, [map, shouldClosePopups, onPopupsClosed]);

  return null;
}

function UserMap() {
  const [spots, setSpots] = useState([]);
  const [message, setMessage] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDestination, setRouteDestination] = useState(null);
  const [routeDistance, setRouteDistance] = useState("");
  const [initialSpots, setInitialSpots] = useState([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpotsList, setShowSpotsList] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingSpotId, setBookingSpotId] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(2);
  const [shouldClosePopups, setShouldClosePopups] = useState(false);
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false); // Add flag to prevent refresh during routing

  const getToken = () => localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/home";
  };

  const fetchSpots = async (isInitialLoad = false) => {
    const token = getToken();
    if (!token) {
      setMessage("Please log in to continue");
      return;
    }

    // Skip refresh if user is actively routing to avoid interruption
    if (!isInitialLoad && (selectedRoute || routeDestination)) {
      return;
    }

    if (isInitialLoad) setIsLoading(true);
    isRefreshingRef.current = true;

    try {
      const res = await fetch("http://localhost:5000/api/spots/available", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch spots");
      }

      const data = await res.json();
      const spotsData = Array.isArray(data) ? data : [];
      
      setSpots(spotsData);
      
      if (isInitialLoad) {
        setInitialSpots(spotsData);
        setTimeout(() => setMapInitialized(true), 500);
      }
      
      setMessage("");
    } catch (err) {
      if (isInitialLoad) {
        setMessage(err.message);
      }
      // Don't show error messages for background refreshes
    } finally {
      if (isInitialLoad) setIsLoading(false);
      isRefreshingRef.current = false;
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location services not available");
      return;
    }

    setMessage("Locating...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = [latitude, longitude];
        
        if (!userLocation || 
            calculateDistance(userLocation[0], userLocation[1], latitude, longitude) > 0.01) {
          setUserLocation(newLocation);
        }
        
        setMessage("");
        setLocationError("");
      },
      (error) => {
        let errorMessage = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = "Location error occurred";
            break;
        }
        setLocationError(errorMessage);
        setMessage("");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000
      }
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const showRoute = (spotLat, spotLng, spotName) => {
    if (!userLocation) {
      setMessage("Location required for directions");
      return;
    }
    
    // Pause auto-refresh when showing route
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    setRouteDestination({ lat: spotLat, lng: spotLng });
    setSelectedRoute(spotName);
    setMessage(`Getting directions to ${spotName}...`);
  };

  const handleRouteFound = (distanceTime) => {
    setRouteDistance(distanceTime);
    if (!distanceTime.includes('unavailable') && !distanceTime.includes('error') && 
        !distanceTime.includes('failed')) {
      setMessage("");
    }
  };

  const clearRoute = () => {
    setRouteDestination(null);
    setSelectedRoute(null);
    setRouteDistance("");
    setSelectedSpot(null);
    setMessage("");
    setShouldClosePopups(true);
    
    // Resume auto-refresh when route is cleared
    if (!refreshIntervalRef.current) {
      refreshIntervalRef.current = setInterval(() => fetchSpots(false), 2000);
    }
  };

  const handlePopupsClosed = () => {
    setShouldClosePopups(false);
  };

  const handleRouteClear = () => {
    // Route cleared by RoutingController
  };

  const openBookingDialog = (id) => {
    setBookingSpotId(id);
    setBookingDuration(2);
    setShowBookingDialog(true);
  };

  const closeBookingDialog = () => {
    setShowBookingDialog(false);
    setBookingSpotId(null);
    setBookingDuration(2);
  };

  const confirmBooking = async () => {
    if (!bookingSpotId || bookingDuration <= 0 || bookingDuration > 8) {
      setMessage("Please enter a valid duration (1-8 hours)");
      return;
    }

    const token = getToken();
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/reserve/${bookingSpotId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ duration_hours: bookingDuration }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");
      
      setMessage("Booking successful!");
      closeBookingDialog();
      
      setSpots(prevSpots => 
        prevSpots.map(spot => 
          spot.id === bookingSpotId 
            ? { ...spot, status: 'occupied' } 
            : spot
        )
      );
      
      if (selectedSpot && selectedSpot.id === bookingSpotId) {
        setSelectedSpot(prev => ({ ...prev, status: 'occupied' }));
      }
      
      setTimeout(() => fetchSpots(false), 1000);
      
      setTimeout(() => {
        setSelectedSpot(null);
        clearRoute();
      }, 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const getSpotStatusInfo = (status) => {
    switch (status) {
      case 'available':
        return { text: 'Available', color: '#059669', bg: '#dcfce7' };
      case 'reserved':
      case 'occupied':
        return { text: 'Occupied', color: '#dc2626', bg: '#fee2e2' };
      case 'unavailable':
        return { text: 'Unavailable', color: '#d97706', bg: '#fed7aa' };
      default:
        return { text: 'Unknown', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const selectSpot = (spot) => {
    setSelectedSpot(spot);
    setShowSpotsList(false);
  };

  useEffect(() => {
    getUserLocation();
    fetchSpots(true);
    
    // Start auto-refresh
    refreshIntervalRef.current = setInterval(() => fetchSpots(false), 2000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const createUserIcon = () => {
    return L.divIcon({
      html: `<div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #2563eb;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
      "></div>`,
      className: 'user-location-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  };

  const createSpotIcon = (spot, isSelected = false) => {
    let color;
    const status = spot.status;
    
    switch (status) {
      case 'available':
        color = '#059669';
        break;
      case 'occupied':
      case 'reserved':
        color = '#dc2626';
        break;
      case 'unavailable':
        color = '#d97706';
        break;
      default:
        color = '#6b7280';
    }
    
    const size = isSelected ? 28 : 24;
    
    return L.divIcon({
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        color: white;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        P
      </div>`,
      className: 'parking-marker',
      iconSize: [size + 4, size + 4],
      iconAnchor: [(size + 4) / 2, (size + 4) / 2]
    });
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center',
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <h2 style={{ color: '#1f2937', fontSize: '18px', fontWeight: '600', margin: '0 0 8px' }}>
            Loading ParkEasy
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Finding nearby parking spots...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      background: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        color: 'white',
        padding: '16px 20px',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
        zIndex: 1000,
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ fontSize: '18px', fontWeight: '800' }}>P</span>
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
                letterSpacing: '-0.5px'
              }}>NextSpot</h1>
              <p style={{
                fontSize: '14px',
                opacity: 0.9,
                margin: 0
              }}>Smart Parking Solutions</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowSpotsList(!showSpotsList)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease'
              }}
            >
              {spots.filter(s => s.status === 'available').length} Available
            </button>
            <a 
              href="/user/reservations" 
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              My Reservations
            </a>
            <button
              onClick={handleLogout}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 20px',
        zIndex: 999,
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={getUserLocation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f0f9ff',
                color: '#0369a1',
                border: '1px solid #0ea5e9',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Find Me
            </button>
            
            <button
              onClick={() => fetchSpots(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f9fafb',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            {(selectedRoute || selectedSpot) && (
              <button
                onClick={clearRoute}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: selectedRoute ? '#dc2626' : '#059669' }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: selectedRoute ? '#dc2626' : '#10b981',
                borderRadius: '50%',
                animation: selectedRoute ? 'none' : 'pulse 2s infinite'
              }}></div>
              {selectedRoute ? 'Route Active' : 'Live Updates'}
            </div>
            <span style={{ color: '#6b7280' }}>
              Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
      {(message || locationError) && (
        <div style={{
          background: locationError || message.includes('error') || message.includes('failed') 
            ? '#fef2f2' : message.includes('successful') ? '#f0fdf4' : '#fffbeb',
          borderBottom: `1px solid ${locationError || message.includes('error') || message.includes('failed') 
            ? '#fecaca' : message.includes('successful') ? '#bbf7d0' : '#fed7aa'}`,
          padding: '12px 20px',
          zIndex: 998
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '1200px',
            margin: '0 auto',
            fontSize: '14px',
            fontWeight: '500',
            color: locationError || message.includes('error') || message.includes('failed') 
              ? '#dc2626' : message.includes('successful') ? '#059669' : '#d97706'
          }}>
            {locationError || (message.includes('error') || message.includes('failed')) ? (
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : message.includes('successful') ? (
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {locationError || message}
          </div>
        </div>
      )}

      <div style={{ 
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {showSpotsList && (
          <div style={{
            width: '350px',
            background: 'white',
            borderRight: '1px solid #e5e7eb',
            overflowY: 'auto',
            zIndex: 100
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 8px'
              }}>Parking Spots</h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0
              }}>
                {spots.filter(s => s.status === 'available').length} of {spots.length} available
              </p>
            </div>
            
            <div style={{ padding: '16px' }}>
              {spots.map((spot) => (
                <div
                  key={spot.id}
                  onClick={() => selectSpot(spot)}
                  style={{
                    padding: '16px',
                    border: selectedSpot?.id === spot.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '12px',
                    background: selectedSpot?.id === spot.id ? '#eff6ff' : 'white'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 4px'
                      }}>{spot.name}</h4>
                      {userLocation && (
                        <p style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          {calculateDistance(userLocation[0], userLocation[1], spot.latitude, spot.longitude).toFixed(1)} km away
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#111827'
                      }}>${spot.price}</div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>per hour</div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: getSpotStatusInfo(spot.status).color,
                      background: getSpotStatusInfo(spot.status).bg,
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      {getSpotStatusInfo(spot.status).text}
                    </span>
                    
                    {spot.status === 'available' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showRoute(spot.latitude, spot.longitude, spot.name);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#f0f9ff',
                            color: '#0369a1',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: '1px solid #0ea5e9',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Directions
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openBookingDialog(spot.id);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#2563eb',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Book Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {spots.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280'
                }}>
                  <svg style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ margin: '0 0 8px', fontWeight: '500' }}>No spots found</p>
                  <p style={{ margin: 0, fontSize: '14px' }}>Try refreshing or check back later</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ 
          flex: 1,
          position: 'relative',
          background: '#f1f5f9'
        }}>
          {mapInitialized ? (
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
                borderRadius: '0',
                border: 'none'
              }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution=""
              />
              
              <ZoomControl position="bottomright" />
              
              <MapController 
                userLocation={userLocation} 
                initialSpots={initialSpots} 
                hasInitialized={mapInitialized}
                hasActiveRoute={!!selectedRoute}
                shouldClosePopups={shouldClosePopups}
                onPopupsClosed={handlePopupsClosed}
              />
              
              <RoutingController 
                userLocation={userLocation} 
                destination={routeDestination}
                onRouteFound={handleRouteFound}
                onRouteClear={handleRouteClear}
              />
              
              {userLocation && (
                <Marker position={userLocation} icon={createUserIcon()}>
                  <Popup>
                    <div style={{ padding: '12px', minWidth: '160px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px', color: '#111827' }}>
                        Your Location
                      </h4>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        Current position
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {spots.map((spot) => (
                <Marker 
                  key={`${spot.id}-${spot.status}`}
                  position={[spot.latitude, spot.longitude]}
                  icon={createSpotIcon(spot, selectedSpot?.id === spot.id)}
                  eventHandlers={{
                    click: () => selectSpot(spot)
                  }}
                >
                  <Popup>
                    <div style={{ padding: '16px', minWidth: '240px' }}>
                      <h4 style={{ fontWeight: '600', color: '#111827', margin: '0 0 12px', fontSize: '18px' }}>
                        {spot.name}
                      </h4>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '8px', 
                        marginBottom: '16px',
                        fontSize: '14px' 
                      }}>
                        <div>
                          <span style={{ color: '#6b7280', display: 'block' }}>Status</span>
                          <span style={{ 
                            fontWeight: '600', 
                            color: getSpotStatusInfo(spot.status).color
                          }}>
                            {getSpotStatusInfo(spot.status).text}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280', display: 'block' }}>Price</span>
                          <span style={{ fontWeight: '600', color: '#111827' }}>
                            ${spot.price}/hr
                          </span>
                        </div>
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: spot.status === 'available' ? '1fr 1fr' : '1fr',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => showRoute(spot.latitude, spot.longitude, spot.name)}
                          style={{
                            padding: '10px',
                            background: '#f0f9ff',
                            color: '#0369a1',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: '1px solid #0ea5e9',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Get Directions
                        </button>
                        {spot.status === 'available' && (
                          <button
                            onClick={() => openBookingDialog(spot.id)}
                            style={{
                              padding: '10px',
                              background: '#2563eb',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: '600',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                          >
                            Reserve Spot
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f1f5f9'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '40px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  Initializing map...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedSpot && (
        <div style={{
          background: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '20px',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '20px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0
                }}>{selectedSpot.name}</h3>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: getSpotStatusInfo(selectedSpot.status).color,
                  background: getSpotStatusInfo(selectedSpot.status).bg,
                  padding: '4px 10px',
                  borderRadius: '8px'
                }}>
                  {getSpotStatusInfo(selectedSpot.status).text}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {userLocation && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {calculateDistance(userLocation[0], userLocation[1], selectedSpot.latitude, selectedSpot.longitude).toFixed(1)} km away
                  </span>
                )}
                {routeDistance && (
                  <>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {routeDistance}
                    </span>
                  </>
                )}
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  ${selectedSpot.price} per hour
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedSpot.status === 'available' && (
                <>
                  <button
                    onClick={() => showRoute(selectedSpot.latitude, selectedSpot.longitude, selectedSpot.name)}
                    style={{
                      background: '#f0f9ff',
                      color: '#0369a1',
                      border: '2px solid #0ea5e9',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Get Directions
                  </button>
                  <button
                    onClick={() => openBookingDialog(selectedSpot.id)}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    Reserve Spot
                  </button>
                </>
              )}
              
              <button
                onClick={clearRoute}
                style={{
                  background: 'transparent',
                  color: '#6b7280',
                  border: '2px solid #d1d5db',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {showBookingDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#eff6ff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                margin: '0 0 8px'
              }}>Reserve Parking Spot</h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0
              }}>How long would you like to reserve this spot?</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>Duration (hours)</label>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                  <button
                    key={hour}
                    onClick={() => setBookingDuration(hour)}
                    style={{
                      padding: '12px',
                      border: bookingDuration === hour ? '2px solid #2563eb' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      background: bookingDuration === hour ? '#eff6ff' : 'white',
                      color: bookingDuration === hour ? '#2563eb' : '#374151',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {hour}h
                  </button>
                ))}
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                color: '#475569'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Duration:</span>
                  <span style={{ fontWeight: '600' }}>{bookingDuration} hour{bookingDuration > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Rate:</span>
                  <span style={{ fontWeight: '600' }}>
                    ${spots.find(s => s.id === bookingSpotId)?.price || 0}/hour
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid #e2e8f0',
                  fontWeight: '700',
                  fontSize: '16px',
                  color: '#111827'
                }}>
                  <span>Total:</span>
                  <span>
                    ${((spots.find(s => s.id === bookingSpotId)?.price || 0) * bookingDuration).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button
                onClick={closeBookingDialog}
                style={{
                  background: 'transparent',
                  color: '#6b7280',
                  border: '2px solid #d1d5db',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmBooking}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                Confirm Booking
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
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideIn {
          0% { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          border: none !important;
        }
        
        .leaflet-popup-tip {
          background: white !important;
        }
        
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        .leaflet-control-zoom a {
          background: white !important;
          color: #374151 !important;
          border: none !important;
          border-radius: 8px !important;
          margin: 2px !important;
          font-weight: 600 !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: #f3f4f6 !important;
        }
        
        .user-location-marker {
          z-index: 1000 !important;
        }
        
        .parking-marker {
          z-index: 999 !important;
        }
        
        .parking-marker:hover div {
          transform: scale(1.15) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default UserMap;