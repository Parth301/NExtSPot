import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Send, Search, ArrowLeft, AlertCircle } from "lucide-react";

function OwnerReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [responseText, setResponseText] = useState({});
    const [filterSpot, setFilterSpot] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [spots, setSpots] = useState([]);
    const token = localStorage.getItem("token");

    // Fetch owner's parking spots - FIXED URL
    useEffect(() => {
        fetch("http://localhost:5000/reviews/owner/spots", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => setSpots(data))
            .catch(err => {
                console.error("Error fetching spots:", err);
                setMessage("Could not load parking spots");
            });
    }, []);

    // Fetch reviews and summary
    useEffect(() => {
        fetchReviews();
        fetchSummary();
    }, [currentPage]);

    const fetchReviews = () => {
        setLoading(true);
        fetch(`http://localhost:5000/reviews/owner/reviews?page=${currentPage}&limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                setReviews(data.reviews || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching reviews:", err);
                setMessage("Failed to load reviews");
                setLoading(false);
            });
    };

    const fetchSummary = () => {
        fetch("http://localhost:5000/reviews/owner/summary", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setSummary(data))
            .catch(err => console.error("Error fetching summary:", err));
    };

    const handleRespond = (reviewId) => {
        const text = responseText[reviewId];
        if (!text || text.trim().length === 0) {
            setMessage("Please enter a response");
            return;
        }

        fetch(`http://localhost:5000/reviews/${reviewId}/respond`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ response_text: text }),
        })
            .then(res => res.json())
            .then(data => {
                setMessage(data.message || "Response submitted successfully");
                setResponseText({ ...responseText, [reviewId]: "" });
                fetchReviews();
                fetchSummary();
            })
            .catch(() => setMessage("Failed to submit response"));
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={16}
                fill={i < rating ? "#F59E0B" : "none"}
                stroke={i < rating ? "#F59E0B" : "#D1D5DB"}
            />
        ));
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSpot = filterSpot === "all" || review.parking_id === parseInt(filterSpot);
        const matchesSearch = review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSpot && matchesSearch;
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F8FAFC',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                padding: '20px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <a
                        href="/owner/dashboard"
                        style={{
                            background: '#F8FAFC',
                            color: '#374151',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            border: '1px solid #E2E8F0',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F1F5F9'}
                        onMouseLeave={(e) => e.target.style.background = '#F8FAFC'}
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </a>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#1E293B'
                        }}>Reviews Management</h1>
                        <p style={{
                            margin: '4px 0 0 0',
                            color: '#64748B',
                            fontSize: '14px'
                        }}>Manage and respond to customer feedback</p>
                    </div>
                </div>
            </div>

            {message && (
                <div style={{
                    background: message.toLowerCase().includes("failed") || message.toLowerCase().includes("could not") ? '#FEF2F2' : '#F0FDF4',
                    color: message.toLowerCase().includes("failed") || message.toLowerCase().includes("could not") ? '#DC2626' : '#16A34A',
                    padding: '12px 32px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderBottom: `1px solid ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("could not") ? '#FECACA' : '#BBF7D0'}`
                }}>
                    {message}
                </div>
            )}

            <div style={{ padding: '24px 32px' }}>
                {/* Summary Cards */}
                {summary && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '20px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <MessageSquare size={20} style={{ color: '#3B82F6' }} />
                                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>Total Reviews</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1E293B' }}>
                                {summary.total_reviews}
                            </div>
                        </div>

                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Star size={20} style={{ color: '#F59E0B' }} />
                                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>Average Rating</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '32px', fontWeight: '700', color: '#1E293B' }}>
                                    {parseFloat(summary.average_rating).toFixed(1)}
                                </span>
                                <span style={{ fontSize: '16px', color: '#64748B' }}>/5.0</span>
                            </div>
                        </div>

                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Send size={20} style={{ color: '#22C55E' }} />
                                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>Response Rate</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1E293B' }}>
                                {summary.total_reviews > 0
                                    ? Math.round((summary.responded_count / summary.total_reviews) * 100)
                                    : 0}%
                            </div>
                        </div>

                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <AlertCircle size={20} style={{ color: '#EF4444' }} />
                                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>Pending Responses</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1E293B' }}>
                                {summary.pending_response_count || 0}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '6px'
                            }}>Filter by Parking Spot</label>
                            <select
                                value={filterSpot}
                                onChange={(e) => setFilterSpot(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    background: '#FFFFFF',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="all">All Spots</option>
                                {spots.map(spot => (
                                    <option key={spot.id} value={spot.id}>{spot.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: '2', minWidth: '300px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '6px'
                            }}>Search Reviews</label>
                            <div style={{ position: 'relative' }}>
                                <Search
                                    size={18}
                                    style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#9CA3AF'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search by user or comment..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 40px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        background: '#FFFFFF',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loading ? (
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            padding: '60px',
                            textAlign: 'center',
                            border: '1px solid #E2E8F0'
                        }}>
                            <div style={{ color: '#64748B', fontSize: '14px' }}>Loading reviews...</div>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            padding: '60px',
                            textAlign: 'center',
                            border: '1px solid #E2E8F0'
                        }}>
                            <MessageSquare size={48} style={{ color: '#D1D5DB', margin: '0 auto 16px' }} />
                            <div style={{ color: '#64748B', fontSize: '16px', fontWeight: '500' }}>
                                No reviews found
                            </div>
                        </div>
                    ) : (
                        filteredReviews.map(review => (
                            <div
                                key={review.id}
                                style={{
                                    background: '#FFFFFF',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: '600', fontSize: '16px', color: '#1E293B' }}>
                                                {review.user_name}
                                            </span>
                                            <span style={{
                                                background: '#F8FAFC',
                                                color: '#64748B',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                {review.spot_name}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', color: '#64748B' }}>
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                {review.comment && (
                                    <p style={{
                                        margin: '0 0 16px 0',
                                        color: '#374151',
                                        fontSize: '14px',
                                        lineHeight: '1.6'
                                    }}>
                                        {review.comment}
                                    </p>
                                )}

                                {/* Rating Details */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '12px',
                                    marginBottom: '16px',
                                    padding: '16px',
                                    background: '#F8FAFC',
                                    borderRadius: '8px'
                                }}>
                                    {review.cleanliness_rating && (
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Cleanliness</div>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {renderStars(review.cleanliness_rating)}
                                            </div>
                                        </div>
                                    )}
                                    {review.safety_rating && (
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Safety</div>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {renderStars(review.safety_rating)}
                                            </div>
                                        </div>
                                    )}
                                    {review.accessibility_rating && (
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Accessibility</div>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {renderStars(review.accessibility_rating)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Owner Response */}
                                {review.my_response ? (
                                    <div style={{
                                        background: '#F0FDF4',
                                        border: '1px solid #BBF7D0',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginTop: '16px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '8px'
                                        }}>
                                            <Send size={14} style={{ color: '#16A34A' }} />
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#16A34A' }}>
                                                Your Response
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#64748B', marginLeft: 'auto' }}>
                                                {new Date(review.response_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            color: '#374151',
                                            fontSize: '14px',
                                            lineHeight: '1.5'
                                        }}>
                                            {review.my_response}
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '16px' }}>
                                        <textarea
                                            placeholder="Write your response to this review..."
                                            value={responseText[review.id] || ""}
                                            onChange={(e) => setResponseText({ ...responseText, [review.id]: e.target.value })}
                                            style={{
                                                width: '100%',
                                                minHeight: '80px',
                                                padding: '12px',
                                                border: '1px solid #D1D5DB',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                resize: 'vertical',
                                                marginBottom: '8px',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                        <button
                                            onClick={() => handleRespond(review.id)}
                                            style={{
                                                padding: '10px 16px',
                                                background: '#1E293B',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'background-color 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#0F172A'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#1E293B'}
                                        >
                                            <Send size={14} />
                                            Send Response
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '24px'
                    }}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '8px 16px',
                                background: currentPage === 1 ? '#F3F4F6' : '#FFFFFF',
                                color: currentPage === 1 ? '#9CA3AF' : '#374151',
                                border: '1px solid #D1D5DB',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ padding: '0 16px', color: '#64748B', fontSize: '14px' }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '8px 16px',
                                background: currentPage === totalPages ? '#F3F4F6' : '#FFFFFF',
                                color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                                border: '1px solid #D1D5DB',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OwnerReviewsPage;