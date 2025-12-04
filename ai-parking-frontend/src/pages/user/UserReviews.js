import React, { useState, useEffect } from 'react';

function UserReviews() {
    const [myReviews, setMyReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [editingReview, setEditingReview] = useState(null);
    const [editForm, setEditForm] = useState({
        rating: 5,
        comment: '',
        cleanliness_rating: null,
        safety_rating: null,
        accessibility_rating: null
    });
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showWriteReview, setShowWriteReview] = useState(false);
const [selectedParkingSpot, setSelectedParkingSpot] = useState(null);
const [bookingId, setBookingId] = useState(null);
const [newReview, setNewReview] = useState({
  rating: 5,
  comment: '',
  cleanliness_rating: null,
  safety_rating: null,
  accessibility_rating: null
});
const [canReviewSpots, setCanReviewSpots] = useState({});

    const getToken = () => localStorage.getItem('token');

    const fetchMyReviews = async () => {
        const token = getToken();
        if (!token) {
            setMessage('Please log in to view your reviews');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/reviews/my-reviews', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch reviews');
            }

            const data = await res.json();
            setMyReviews(data);
            setMessage('');
        } catch (err) {
            setMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const checkIfCanReview = async (parkingId) => {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5000/reviews/can-review/${parkingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      setCanReviewSpots(prev => ({
        ...prev,
        [parkingId]: data
      }));
      return data;
    }
  } catch (err) {
    console.error('Error checking review eligibility:', err);
  }
  return null;
};

const submitNewReview = async () => {
  const token = getToken();
  if (!token) {
    setMessage('Please log in to submit review');
    return;
  }

  if (!selectedParkingSpot || !bookingId) {
    setMessage('Parking spot and booking information required');
    return;
  }

  if (newReview.rating < 1 || newReview.rating > 5) {
    setMessage('Rating must be between 1 and 5');
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/reviews/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        parking_id: selectedParkingSpot.id,
        booking_id: bookingId,
        rating: newReview.rating,
        comment: newReview.comment || null,
        cleanliness_rating: newReview.cleanliness_rating,
        safety_rating: newReview.safety_rating,
        accessibility_rating: newReview.accessibility_rating
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit review');

    setMessage('Review submitted successfully!');
    closeWriteReview();
    fetchMyReviews();
    setTimeout(() => setMessage(''), 3000);
  } catch (err) {
    setMessage(err.message);
  }
};

const closeWriteReview = () => {
  setShowWriteReview(false);
  setSelectedParkingSpot(null);
  setBookingId(null);
  setNewReview({
    rating: 5,
    comment: '',
    cleanliness_rating: null,
    safety_rating: null,
    accessibility_rating: null
  });
};

const openWriteReview = (spot) => {
  // Check if user already has a review for this spot
  if (spot) {
    const existingReview = myReviews.find(r => r.parking_id === spot.id);
    if (existingReview) {
      setMessage(`You already have a review for ${spot.name}. You can edit or delete it instead.`);
      return;
    }
  }

  setSelectedParkingSpot(spot);
  setShowWriteReview(true);
  
  // Extract booking ID from URL params if available
  const params = new URLSearchParams(window.location.search);
  const bookingIdFromUrl = params.get('bookingId');
  if (bookingIdFromUrl) {
    setBookingId(parseInt(bookingIdFromUrl));
  }
};
    const startEdit = (review) => {
        setEditingReview(review.id);
        setEditForm({
            rating: review.rating,
            comment: review.comment || '',
            cleanliness_rating: review.cleanliness_rating,
            safety_rating: review.safety_rating,
            accessibility_rating: review.accessibility_rating
        });
    };

    const cancelEdit = () => {
        setEditingReview(null);
        setEditForm({
            rating: 5,
            comment: '',
            cleanliness_rating: null,
            safety_rating: null,
            accessibility_rating: null
        });
    };

    const handleUpdate = async (reviewId) => {
        const token = getToken();
        if (!token) {
            setMessage('Please log in to update review');
            return;
        }

        if (editForm.rating < 1 || editForm.rating > 5) {
            setMessage('Rating must be between 1 and 5');
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update review');

            setMessage('Review updated successfully!');
            cancelEdit();
            fetchMyReviews();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.message);
        }
    };

    const handleDelete = async (reviewId) => {
        const token = getToken();
        if (!token) {
            setMessage('Please log in to delete review');
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to delete review');

            setMessage('Review deleted successfully!');
            setDeleteConfirm(null);
            fetchMyReviews();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.message);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderStars = (rating, interactive = false, onRate = null) => {
        return (
            <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        onClick={() => interactive && onRate && onRate(star)}
                        style={{
                            width: '24px',
                            height: '24px',
                            fill: star <= rating ? '#fbbf24' : '#e5e7eb',
                            cursor: interactive ? 'pointer' : 'default',
                            transition: 'all 0.2s ease'
                        }}
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    useEffect(() => {
        fetchMyReviews();
    }, []);
    useEffect(() => {
  // Check if redirected with spotId for writing a review
  const params = new URLSearchParams(window.location.search);
  const spotId = params.get('spotId');
  const bookingIdFromUrl = params.get('bookingId');
  
  if (spotId && myReviews.length > 0) {
    // Check if user already has a review for this spot
    const existingReview = myReviews.find(r => r.parking_id === parseInt(spotId));
    if (existingReview) {
      setMessage('You have already reviewed this parking spot. You can edit or delete your review.');
      return;
    }
    
    // Check if user can review this spot
    checkIfCanReview(parseInt(spotId)).then(canReview => {
      if (canReview && canReview.canReview) {
        const spotData = { id: parseInt(spotId), name: 'Parking Spot' };
        setSelectedParkingSpot(spotData);
        setShowWriteReview(true);
        if (bookingIdFromUrl) {
          setBookingId(parseInt(bookingIdFromUrl));
        }
      } else {
        setMessage('You cannot review this parking spot. You need a completed booking.');
      }
    });
  }
}, [myReviews]);

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
                        borderTop: '4px solid #fbbf24',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 24px'
                    }}></div>
                    <h2 style={{ color: '#1f2937', fontSize: '18px', fontWeight: '600', margin: '0 0 8px' }}>
                        Loading Your Reviews
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                        Please wait...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '20px 24px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => window.location.href = '/user/dashboard'}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: 'white',
                                padding: '10px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                margin: '0 0 4px',
                                letterSpacing: '-0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                My Reviews
                            </h1>
                            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                                Manage your parking spot reviews
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
  <button
    onClick={() => window.location.href = '/user/reservations'}
    style={{
      background: 'linear-gradient(135deg, #ffb108ff 0%, #ecb967ff 100%)',
      color: 'white',
      padding: '10px 18px',
      borderRadius: '10px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
      transition: 'all 0.2s ease'
    }}
  >
    <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
    Write Review
  </button>
</div>

                </div>
            </header>

            {/* Message Banner */}
            {message && (
                <div style={{
                    background: message.includes('success') ? '#f0fdf4' : message.includes('error') || message.includes('Failed') ? '#fef2f2' : '#fffbeb',
                    borderBottom: `1px solid ${message.includes('success') ? '#bbf7d0' : message.includes('error') || message.includes('Failed') ? '#fecaca' : '#fed7aa'}`,
                    padding: '12px 24px'
                }}>
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: message.includes('success') ? '#059669' : message.includes('error') || message.includes('Failed') ? '#dc2626' : '#d97706'
                    }}>
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {message.includes('success') ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                        </svg>
                        {message}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '32px 24px'
            }}>
                {/* Summary Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #fbbf24'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#92400e', fontWeight: '600', margin: '0 0 4px' }}>
                                    Total Reviews
                                </p>
                                <p style={{ fontSize: '32px', fontWeight: '800', color: '#78350f', margin: 0 }}>
                                    {myReviews.length}
                                </p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'rgba(251, 191, 36, 0.3)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg style={{ width: '24px', height: '24px', color: '#92400e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #3b82f6'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600', margin: '0 0 4px' }}>
                                    Average Rating
                                </p>
                                <p style={{ fontSize: '32px', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>
                                    {myReviews.length > 0
                                        ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
                                        : '0.0'}
                                </p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'rgba(59, 130, 246, 0.3)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg style={{ width: '24px', height: '24px', color: '#1e40af' }} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #10b981'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#065f46', fontWeight: '600', margin: '0 0 4px' }}>
                                    With Responses
                                </p>
                                <p style={{ fontSize: '32px', fontWeight: '800', color: '#064e3b', margin: 0 }}>
                                    {myReviews.filter(r => r.owner_response).length}
                                </p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'rgba(16, 185, 129, 0.3)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg style={{ width: '24px', height: '24px', color: '#065f46' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                {myReviews.length === 0 ? (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '80px 40px',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#fef3c7',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <svg style={{ width: '40px', height: '40px', color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 12px' }}>
                            No Reviews Yet
                        </h3>
                        <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 24px' }}>
                            You haven't written any reviews yet. Complete a booking to leave your first review!
                        </p>
                        <button
                            onClick={() => window.location.href = '/user/dashboard'}
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '10px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Find Parking Spots
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {myReviews.map((review) => (
                            <div
                                key={review.id}
                                style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '28px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                    border: '1px solid #e5e7eb'
                                }}
                            >
                                {editingReview === review.id ? (
                                    // Edit Mode
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '24px',
                                            paddingBottom: '20px',
                                            borderBottom: '2px solid #f3f4f6'
                                        }}>
                                            <h3 style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: '#111827',
                                                margin: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}>
                                                <svg style={{ width: '24px', height: '24px', color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Editing Review for {review.spot_name}
                                            </h3>
                                        </div>

                                        {/* Overall Rating */}
                                        <div style={{ marginBottom: '24px' }}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#374151',
                                                marginBottom: '10px'
                                            }}>
                                                Overall Rating *
                                            </label>
                                            {renderStars(editForm.rating, true, (rating) => setEditForm({ ...editForm, rating }))}
                                        </div>

                                        {/* Additional Ratings */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '20px',
                                            marginBottom: '24px'
                                        }}>
                                            <div>
                                                <label style={{
                                                    display: 'block',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#6b7280',
                                                    marginBottom: '8px'
                                                }}>
                                                    Cleanliness
                                                </label>
                                                <div style={{ display: 'flex', gap: '3px' }}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <svg
                                                            key={star}
                                                            onClick={() => setEditForm({ ...editForm, cleanliness_rating: star })}
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                fill: star <= (editForm.cleanliness_rating || 0) ? '#fbbf24' : '#e5e7eb',
                                                                cursor: 'pointer'
                                                            }}
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{
                                                    display: 'block',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#6b7280',
                                                    marginBottom: '8px'
                                                }}>
                                                    Safety
                                                </label>
                                                <div style={{ display: 'flex', gap: '3px' }}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <svg
                                                            key={star}
                                                            onClick={() => setEditForm({ ...editForm, safety_rating: star })}
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                fill: star <= (editForm.safety_rating || 0) ? '#fbbf24' : '#e5e7eb',
                                                                cursor: 'pointer'
                                                            }}
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{
                                                    display: 'block',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#6b7280',
                                                    marginBottom: '8px'
                                                }}>
                                                    Accessibility
                                                </label>
                                                <div style={{ display: 'flex', gap: '3px' }}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <svg
                                                            key={star}
                                                            onClick={() => setEditForm({ ...editForm, accessibility_rating: star })}
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                fill: star <= (editForm.accessibility_rating || 0) ? '#fbbf24' : '#e5e7eb',
                                                                cursor: 'pointer'
                                                            }}
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        <div style={{ marginBottom: '24px' }}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#374151',
                                                marginBottom: '10px'
                                            }}>
                                                Your Review
                                            </label>
                                            <textarea
                                                value={editForm.comment}
                                                onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                                                maxLength={1000}
                                                placeholder="Share your experience with this parking spot..."
                                                style={{
                                                    width: '100%',
                                                    minHeight: '120px',
                                                    padding: '12px',
                                                    border: '2px solid #e5e7eb',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit',
                                                    resize: 'vertical',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s ease'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                            />
                                            <p style={{
                                                fontSize: '12px',
                                                color: '#6b7280',
                                                margin: '6px 0 0',
                                                textAlign: 'right'
                                            }}>
                                                {editForm.comment.length}/1000 characters
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            justifyContent: 'flex-end'
                                        }}>
                                            <button
                                                onClick={cancelEdit}
                                                style={{
                                                    background: 'transparent',
                                                    color: '#6b7280',
                                                    border: '2px solid #d1d5db',
                                                    padding: '10px 20px',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdate(review.id)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '10px 24px',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            marginBottom: '20px'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginBottom: '8px'
                                                }}>
                                                    <h3 style={{
                                                        fontSize: '20px',
                                                        fontWeight: '700',
                                                        color: '#111827',
                                                        margin: 0
                                                    }}>
                                                        {review.spot_name}
                                                    </h3>
                                                    <button
                                                        onClick={() => window.location.href = `/user/spot/${review.parking_id}/reviews`}
                                                        style={{
                                                            background: '#f0f9ff',
                                                            color: '#0369a1',
                                                            border: '1px solid #0ea5e9',
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        View All
                                                    </button>
                                                </div>
                                                <p style={{
                                                    fontSize: '13px',
                                                    color: '#6b7280',
                                                    margin: 0
                                                }}>
                                                    Reviewed on {formatDate(review.created_at)}
                                                    {review.updated_at && review.updated_at !== review.created_at && (
                                                        <span> • Updated {formatDate(review.updated_at)}</span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => startEdit(review)}
                                                    style={{
                                                        background: '#f0f9ff',
                                                        color: '#0369a1',
                                                        border: '1px solid #0ea5e9',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(review.id)}
                                                    style={{
                                                        background: '#fef2f2',
                                                        color: '#dc2626',
                                                        border: '1px solid #fca5a5',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Rating Display */}
                                        <div style={{
                                            background: '#fef3c7',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            marginBottom: '20px'
                                        }}>
                                            <div style={{ marginBottom: '12px' }}>
                                                <span style={{
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#92400e',
                                                    marginBottom: '6px',
                                                    display: 'block'
                                                }}>
                                                    Overall Rating
                                                </span>
                                                {renderStars(review.rating, false)}
                                            </div>

                                            {(review.cleanliness_rating || review.safety_rating || review.accessibility_rating) && (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                                    gap: '12px',
                                                    paddingTop: '12px',
                                                    borderTop: '1px solid #fde68a'
                                                }}>
                                                    {review.cleanliness_rating && (
                                                        <div>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                color: '#92400e',
                                                                fontWeight: '600',
                                                                display: 'block',
                                                                marginBottom: '4px'
                                                            }}>
                                                                Cleanliness
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg
                                                                        key={i}
                                                                        style={{
                                                                            width: '14px',
                                                                            height: '14px',
                                                                            fill: i < review.cleanliness_rating ? '#fbbf24' : '#e5e7eb'
                                                                        }}
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {review.safety_rating && (
                                                        <div>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                color: '#92400e',
                                                                fontWeight: '600',
                                                                display: 'block',
                                                                marginBottom: '4px'
                                                            }}>
                                                                Safety
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg
                                                                        key={i}
                                                                        style={{
                                                                            width: '14px',
                                                                            height: '14px',
                                                                            fill: i < review.safety_rating ? '#fbbf24' : '#e5e7eb'
                                                                        }}
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {review.accessibility_rating && (
                                                        <div>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                color: '#92400e',
                                                                fontWeight: '600',
                                                                display: 'block',
                                                                marginBottom: '4px'
                                                            }}>
                                                                Accessibility
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg
                                                                        key={i}
                                                                        style={{
                                                                            width: '14px',
                                                                            height: '14px',
                                                                            fill: i < review.accessibility_rating ? '#fbbf24' : '#e5e7eb'
                                                                        }}
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Comment */}
                                        {review.comment && (
                                            <div style={{
                                                background: '#f9fafb',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                marginBottom: '20px'
                                            }}>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: '#374151',
                                                    lineHeight: '1.6',
                                                    margin: 0,
                                                    whiteSpace: 'pre-wrap'
                                                }}>
                                                    {review.comment}
                                                </p>
                                            </div>
                                        )}

                                        {/* Owner Response */}
                                        {review.owner_response && (
                                            <div style={{
                                                background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                borderLeft: '4px solid #3b82f6'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '10px'
                                                }}>
                                                    <svg style={{ width: '18px', height: '18px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        fontWeight: '700',
                                                        color: '#1e40af'
                                                    }}>
                                                        Response from {review.owner_name || 'Owner'}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        color: '#6b7280'
                                                    }}>
                                                        • {formatDate(review.response_date)}
                                                    </span>
                                                </div>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: '#1e3a8a',
                                                    lineHeight: '1.6',
                                                    margin: 0,
                                                    whiteSpace: 'pre-wrap'
                                                }}>
                                                    {review.owner_response}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Delete Confirmation Modal */}
                                {deleteConfirm === review.id && (
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
                                            padding: '28px',
                                            maxWidth: '400px',
                                            width: '90%',
                                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
                                        }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                background: '#fef2f2',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 16px'
                                            }}>
                                                <svg style={{ width: '24px', height: '24px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <h3 style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: '#111827',
                                                margin: '0 0 8px',
                                                textAlign: 'center'
                                            }}>
                                                Delete Review?
                                            </h3>
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#6b7280',
                                                margin: '0 0 24px',
                                                textAlign: 'center',
                                                lineHeight: '1.5'
                                            }}>
                                                Are you sure you want to delete this review? This action cannot be undone.
                                            </p>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '12px'
                                            }}>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    style={{
                                                        background: 'transparent',
                                                        color: '#6b7280',
                                                        border: '2px solid #d1d5db',
                                                        padding: '10px 16px',
                                                        borderRadius: '10px',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(review.id)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '10px 16px',
                                                        borderRadius: '10px',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                

            </div>

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default UserReviews;