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
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: null,
    minDistance: 0,
    maxDistance: null,
    status: 'all',
    sortBy: 'distance'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [reviewSummaries, setReviewSummaries] = useState({});
  const [canReviewSpots, setCanReviewSpots] = useState({});
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedSpotReviews, setSelectedSpotReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPagination, setReviewsPagination] = useState(null);
  const [selectedSpotForReviews, setSelectedSpotForReviews] = useState(null)
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

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
        spotsData.forEach(spot => {
          fetchReviewSummary(spot.id);
          checkCanReview(spot.id);
        });
      }
      setMessage("");
    } catch (err) {
      if (isInitialLoad) {
        setMessage(err.message);
      }
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
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const fetchReviewSummary = async (spotId) => {
    const token = getToken();
    if (!token || reviewSummaries[spotId]) return;

    try {
      const res = await fetch(`http://localhost:5000/reviews/spot/${spotId}/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // Ensure average_rating is a number
        const sanitizedData = {
          ...data,
          average_rating: parseFloat(data.average_rating) || 0,
          total_reviews: parseInt(data.total_reviews) || 0
        };
        setReviewSummaries(prev => ({
          ...prev,
          [spotId]: sanitizedData
        }));
      }
    } catch (err) {
      console.error('Error fetching review summary:', err);
    }
  };

  const checkCanReview = async (spotId) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/reviews/can-review/${spotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setCanReviewSpots(prev => ({
          ...prev,
          [spotId]: data
        }));
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };
  // ✅ ADD THESE NEW FUNCTIONS BELOW ↓
  const fetchSpotReviews = async (spotId, page = 1) => {
    const token = getToken();
    if (!token) return;

    setReviewsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/reviews/spot/${spotId}?page=${page}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setSelectedSpotReviews(data.reviews || []);
        setReviewsPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setSelectedSpotReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const openReviewsModal = (spot) => {
    setSelectedSpotForReviews(spot);
    setShowReviewsModal(true);
    setReviewsPage(1);
    fetchSpotReviews(spot.id, 1);
  };

  const closeReviewsModal = () => {
    setShowReviewsModal(false);
    setSelectedSpotReviews([]);
    setReviewsPagination(null);
    setSelectedSpotForReviews(null);
  };

  const handleReviewsPageChange = (newPage) => {
    if (selectedSpotForReviews) {
      setReviewsPage(newPage);
      fetchSpotReviews(selectedSpotForReviews.id, newPage);
    }
  };

  const voteOnReview = async (reviewId, isHelpful) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:5000/reviews/${reviewId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ is_helpful: isHelpful })
        }
      );

      if (res.ok) {
        if (selectedSpotForReviews) {
          fetchSpotReviews(selectedSpotForReviews.id, reviewsPage);
        }
      }
    } catch (err) {
      console.error('Error voting on review:', err);
    }
  };

  const showRoute = (spotLat, spotLng, spotName) => {
    if (!userLocation) {
      setMessage("Location required for directions");
      return;
    }

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

  const filterAndSortSpots = (spotsToFilter) => {
    let filtered = spotsToFilter.filter(spot => {
      // Price filter
      if (spot.price < filters.minPrice) return false;
      if (filters.maxPrice !== null && spot.price > filters.maxPrice) return false;

      // Distance filter
      if (userLocation) {
        const distance = calculateDistance(
          userLocation[0],
          userLocation[1],
          spot.latitude,
          spot.longitude
        );
        if (distance < filters.minDistance) return false;
        if (filters.maxDistance !== null && distance > filters.maxDistance) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'unavailable') {
          if (spot.status !== 'unavailable' && spot.status !== 'occupied') return false;
        } else {
          if (spot.status !== filters.status) return false;
        }
      }

      return true;
    });

    // Keep existing sort logic
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'distance':
          if (!userLocation) return 0;
          const distA = calculateDistance(userLocation[0], userLocation[1], a.latitude, a.longitude);
          const distB = calculateDistance(userLocation[0], userLocation[1], b.latitude, b.longitude);
          return distA - distB;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const resetFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: null,
      minDistance: 0,
      maxDistance: null,
      status: 'all',
      sortBy: 'distance'
    });
  };

  const filteredSpots = filterAndSortSpots(spots);

  useEffect(() => {
    getUserLocation();
    fetchSpots(true);

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
                background: showSpotsList ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                color: showSpotsList ? '#2563eb' : 'white',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: showSpotsList ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>{filteredSpots.filter(s => s.status === 'available').length} Available</span>
            </button>

            <a
              href="/user/reservations"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '10px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Bookings
            </a>

            <a
              href="/user/reviews"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '10px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              My Reviews
            </a>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(220, 38, 38, 0.9)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
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
            width: '380px',
            background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
            borderRight: '1px solid #e5e7eb',
            overflowY: 'auto',
            zIndex: 100,
            boxShadow: '4px 0 12px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f3f4f6',
              background: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg style={{ width: '22px', height: '22px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Available Spots
                </h3>
                <button
                  onClick={() => setShowSpotsList(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  width: '100%',
                  background: showFilters ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#f9fafb',
                  color: showFilters ? 'white' : '#374151',
                  border: showFilters ? 'none' : '1px solid #d1d5db',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  boxShadow: showFilters ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
                }}
              >
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>

              {showFilters && (
                <div style={{
                  background: '#f9fafb',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  {/* Price Filter */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '8px'
                    }}>
                      <svg style={{ width: '16px', height: '16px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Price Range
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          placeholder="Min ₹"
                          min="0"
                          step="10"
                          value={filters.minPrice || ''}
                          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Math.max(0, Number(e.target.value)) : 0 })}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          placeholder="Max ₹"
                          min="0"
                          step="10"
                          value={filters.maxPrice || ''}
                          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Distance Filter */}
                  <div style={{ marginBottom: '16px', opacity: userLocation ? 1 : 0.5 }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '8px'
                    }}>
                      <svg style={{ width: '16px', height: '16px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Distance Range (km)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          placeholder="Min"
                          min="0"
                          step="0.5"
                          value={filters.minDistance || ''}
                          onChange={(e) => setFilters({ ...filters, minDistance: e.target.value ? Math.max(0, Number(e.target.value)) : 0 })}
                          disabled={!userLocation}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: userLocation ? 'text' : 'not-allowed'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          placeholder="Max"
                          min="0"
                          step="0.5"
                          value={filters.maxDistance || ''}
                          onChange={(e) => setFilters({ ...filters, maxDistance: e.target.value ? Number(e.target.value) : null })}
                          disabled={!userLocation}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: userLocation ? 'text' : 'not-allowed'
                          }}
                        />
                      </div>
                    </div>
                    {!userLocation && (
                      <p style={{ fontSize: '11px', color: '#dc2626', margin: '6px 0 0', fontWeight: '500' }}>
                        ⚠️ Enable location to filter by distance
                      </p>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '8px'
                    }}>
                      <svg style={{ width: '16px', height: '16px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        background: 'white',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="all">All Spots</option>
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '8px'
                    }}>
                      <svg style={{ width: '16px', height: '16px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      Sort By
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        background: 'white',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="distance">Distance (Nearest)</option>
                      <option value="price-low">Price (Low to High)</option>
                      <option value="price-high">Price (High to Low)</option>
                      <option value="name">Name (A-Z)</option>
                    </select>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={resetFilters}
                    style={{
                      width: '100%',
                      background: 'white',
                      color: '#dc2626',
                      border: '1px solid #dc2626',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}

              <div style={{
                background: '#eff6ff',
                padding: '10px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
                  {filteredSpots.length} of {spots.length} spots
                </span>
                <span style={{
                  background: '#2563eb',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {filteredSpots.filter(s => s.status === 'available').length} available
                </span>
              </div>
            </div>

            <div style={{ padding: '16px' }}>
              {filteredSpots.map((spot) => (
                <div
                  key={spot.id}
                  onClick={() => selectSpot(spot)}
                  style={{
                    padding: '18px',
                    border: selectedSpot?.id === spot.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: '12px',
                    background: selectedSpot?.id === spot.id ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'white',
                    boxShadow: selectedSpot?.id === spot.id ? '0 4px 16px rgba(37, 99, 235, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
                    transform: selectedSpot?.id === spot.id ? 'scale(1.02)' : 'scale(1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '14px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '17px',
                        fontWeight: '700',
                        color: '#111827',
                        margin: '0 0 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <svg style={{ width: '18px', height: '18px', color: '#2563eb' }} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                        </svg>
                        {spot.name}
                      </h4>
                      {reviewSummaries[spot.id] && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '4px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  fill: i < Math.round(reviewSummaries[spot.id].average_rating) ? '#fbbf24' : '#e5e7eb'
                                }}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#d97706' }}>
                            {reviewSummaries[spot.id].average_rating > 0
                              ? reviewSummaries[spot.id].average_rating.toFixed(1)
                              : 'New'}
                          </span>
                          {reviewSummaries[spot.id].total_reviews > 0 && (
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                              ({reviewSummaries[spot.id].total_reviews})
                            </span>
                          )}
                        </div>
                      )}
                      {userLocation && (
                        <p style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          {calculateDistance(userLocation[0], userLocation[1], spot.latitude, spot.longitude).toFixed(1)} km away
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: '#2563eb',
                        lineHeight: 1
                      }}>₹{spot.price}</div>
                      <div style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>per hour</div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: getSpotStatusInfo(spot.status).color,
                      background: getSpotStatusInfo(spot.status).bg,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: getSpotStatusInfo(spot.status).color
                      }}></div>
                      {getSpotStatusInfo(spot.status).text}
                    </span>

                    {spot.status === 'available' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showRoute(spot.latitude, spot.longitude, spot.name);
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: 'white',
                              color: '#0369a1',
                              fontSize: '12px',
                              fontWeight: '600',
                              border: '2px solid #0ea5e9',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Route
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openBookingDialog(spot.id);
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                            }}
                          >
                            Book
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReviewsModal(spot);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: '2px solid #fbbf24',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          View Reviews {reviewSummaries[spot.id]?.total_reviews > 0 && `(${reviewSummaries[spot.id].total_reviews})`}
                          {canReviewSpots[spot.id]?.canReview && (
                            <span style={{
                              background: '#059669',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '700',
                              marginLeft: '4px'
                            }}>
                              Can Review
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredSpots.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#f3f4f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <svg style={{ width: '40px', height: '40px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p style={{ margin: '0 0 8px', fontWeight: '600', fontSize: '16px', color: '#374151' }}>No spots found</p>
                  <p style={{ margin: '0 0 16px', fontSize: '14px' }}>Try adjusting your filters</p>
                  <button
                    onClick={resetFilters}
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    Reset Filters
                  </button>
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

              {filteredSpots.map((spot) => (
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
                      {reviewSummaries[spot.id] && reviewSummaries[spot.id].average_rating > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '12px',
                          padding: '8px',
                          background: '#fef3c7',
                          borderRadius: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  fill: i < Math.round(reviewSummaries[spot.id].average_rating) ? '#fbbf24' : '#e5e7eb'
                                }}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#92400e' }}>
                            {reviewSummaries[spot.id].average_rating.toFixed(1)} ({reviewSummaries[spot.id].total_reviews} reviews)
                          </span>
                        </div>
                      )}
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
                            ₹{spot.price}/hr
                          </span>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
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
                        <button
                          onClick={() => openReviewsModal(spot)}
                          style={{
                            padding: '10px',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: '2px solid #fbbf24',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          View Reviews
                          {canReviewSpots[spot.id]?.canReview && (
                            <span style={{
                              background: '#059669',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              Can Review
                            </span>
                          )}
                        </button>
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
                  ₹{selectedSpot.price} per hour
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
                    ₹{spots.find(s => s.id === bookingSpotId)?.price || 0}/hour
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
                    ₹{((spots.find(s => s.id === bookingSpotId)?.price || 0) * bookingDuration).toFixed(2)}
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
      {showReviewsModal && selectedSpotForReviews && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          backdropFilter: 'blur(4px)',
          overflowY: 'auto',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '0',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              borderRadius: '16px 16px 0 0',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg style={{ width: '28px', height: '28px' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {selectedSpotForReviews.name}
                  </h3>
                  <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                    See what others are saying about this parking spot
                  </p>
                  {reviewSummaries[selectedSpotForReviews.id] && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            style={{
                              width: '18px',
                              height: '18px',
                              fill: i < Math.round(reviewSummaries[selectedSpotForReviews.id].average_rating) ? '#fbbf24' : 'rgba(255,255,255,0.3)'
                            }}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: '700' }}>
                        {reviewSummaries[selectedSpotForReviews.id].average_rating.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '14px', opacity: 0.9 }}>
                        ({reviewSummaries[selectedSpotForReviews.id].total_reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={closeReviewsModal}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px'
            }}>
              {reviewsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }}></div>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading reviews...</p>
                </div>
              ) : selectedSpotReviews.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#f3f4f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <svg style={{ width: '40px', height: '40px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p style={{ margin: '0 0 8px', fontWeight: '600', fontSize: '16px', color: '#374151' }}>
                    No reviews yet
                  </p>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Be the first to review this parking spot!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedSpotReviews.map((review) => (
                    <div key={review.id} style={{
                      padding: '20px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      background: '#f9fafb',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px'
                          }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '14px'
                            }}>
                              {review.user_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <h4 style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#111827',
                                margin: 0
                              }}>
                                {review.user_name || 'Anonymous User'}
                              </h4>
                              <p style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                margin: 0
                              }}>
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              style={{
                                width: '16px',
                                height: '16px',
                                fill: i < review.rating ? '#fbbf24' : '#e5e7eb'
                              }}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>

                      {review.comment && (
                        <p style={{
                          fontSize: '14px',
                          color: '#374151',
                          lineHeight: '1.6',
                          margin: '0 0 12px',
                          padding: '12px',
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          {review.comment}
                        </p>
                      )}

                      {(review.cleanliness_rating || review.safety_rating || review.accessibility_rating) && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          {review.cleanliness_rating && (
                            <div style={{
                              padding: '8px',
                              background: 'white',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              textAlign: 'center'
                            }}>
                              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px', fontWeight: '500' }}>
                                Cleanliness
                              </p>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb', margin: 0 }}>
                                {review.cleanliness_rating}/5
                              </p>
                            </div>
                          )}
                          {review.safety_rating && (
                            <div style={{
                              padding: '8px',
                              background: 'white',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              textAlign: 'center'
                            }}>
                              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px', fontWeight: '500' }}>
                                Safety
                              </p>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb', margin: 0 }}>
                                {review.safety_rating}/5
                              </p>
                            </div>
                          )}
                          {review.accessibility_rating && (
                            <div style={{
                              padding: '8px',
                              background: 'white',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              textAlign: 'center'
                            }}>
                              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px', fontWeight: '500' }}>
                                Access
                              </p>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb', margin: 0 }}>
                                {review.accessibility_rating}/5
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          <button
                            onClick={() => voteOnReview(review.id, true)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'white',
                              border: '1px solid #d1d5db',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#374151'
                            }}
                          >
                            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            Helpful ({review.helpful_count || 0})
                          </button>
                          <button
                            onClick={() => voteOnReview(review.id, false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'white',
                              border: '1px solid #d1d5db',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#374151'
                            }}
                          >
                            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                            Not Helpful ({review.not_helpful_count || 0})
                          </button>
                        </div>
                        {review.updated_at !== review.created_at && (
                          <span style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            fontStyle: 'italic'
                          }}>
                            Edited
                          </span>
                        )}
                      </div>

                      {review.owner_response && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: '#eff6ff',
                          border: '1px solid #dbeafe',
                          borderRadius: '8px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '8px'
                          }}>
                            <svg style={{ width: '16px', height: '16px', color: '#2563eb' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                            </svg>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1e40af'
                            }}>
                              Response from {review.owner_name || 'Owner'}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: '#6b7280'
                            }}>
                              • {new Date(review.response_created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '13px',
                            color: '#1e3a8a',
                            lineHeight: '1.5',
                            margin: 0
                          }}>
                            {review.owner_response}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer with Pagination */}
            {reviewsPagination && reviewsPagination.totalPages > 1 && (
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb',
                background: '#f9fafb',
                borderRadius: '0 0 16px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  Page {reviewsPagination.page} of {reviewsPagination.totalPages}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleReviewsPageChange(reviewsPage - 1)}
                    disabled={reviewsPage === 1}
                    style={{
                      padding: '8px 16px',
                      background: reviewsPage === 1 ? '#f3f4f6' : 'white',
                      color: reviewsPage === 1 ? '#9ca3af' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: reviewsPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleReviewsPageChange(reviewsPage + 1)}
                    disabled={reviewsPage === reviewsPagination.totalPages}
                    style={{
                      padding: '8px 16px',
                      background: reviewsPage === reviewsPagination.totalPages ? '#f3f4f6' : '#2563eb',
                      color: reviewsPage === reviewsPagination.totalPages ? '#9ca3af' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: reviewsPage === reviewsPagination.totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Can Review Badge */}
            {canReviewSpots[selectedSpotForReviews.id]?.canReview && (
              <div style={{
                padding: '16px 24px',
                background: '#dcfce7',
                borderTop: '1px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '20px', height: '20px', color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                    You can review this parking spot!
                  </span>
                </div>
                <button
                  onClick={() => {
                    closeReviewsModal();
                    window.location.href = `/user/reservations?spotId=${selectedSpotForReviews.id}&bookingId=${canReviewSpots[selectedSpotForReviews.id].booking_id}`;
                  }}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Write Review
                </button>
              </div>
            )}
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

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #2563eb;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #2563eb;
          cursor: pointer;
          border-radius: 50%;
          border: none;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
        }
      `}</style>
    </div>
  );
}

export default UserMap;