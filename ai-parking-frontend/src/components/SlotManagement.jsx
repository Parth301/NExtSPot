import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckSquare,
  Square,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Color helper moved outside the component to keep a stable reference.
 */
const getSlotStatusColor = (slot) => {
  if (slot.status === "disabled")
    return { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" };
  if (slot.status === "occupied")
    return { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5" };
  return { bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" };
};

/**
 * Memoized SlotCard: re-renders only when the slot props change.
 * Includes a custom comparison to minimize unnecessary updates.
 */
const SlotCard = React.memo(function SlotCard({
  slot,
  onToggle,
  onOpenDelete,
  bulkMode,
  isSelected,
  onSelect,
}) {
  const colors = getSlotStatusColor(slot);

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${isSelected ? "#3B82F6" : colors.border}`,
        borderRadius: "8px",
        padding: "16px",
        transition: "all 0.2s ease",
        position: "relative",
        cursor: bulkMode ? "pointer" : "default",
      }}
      onClick={() => bulkMode && onSelect(slot.slot_id)}
    >
      {bulkMode && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "20px",
            height: "20px",
            borderRadius: "4px",
            border: `2px solid ${isSelected ? "#3B82F6" : "#D1D5DB"}`,
            background: isSelected ? "#3B82F6" : "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSelected && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M10 3L4.5 8.5L2 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <div>
          <div
            style={{ fontSize: "20px", fontWeight: "600", color: colors.text }}
          >
            #{slot.slot_number}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: colors.text,
              marginTop: "2px",
              textTransform: "capitalize",
            }}
          >
            {slot.status}
          </div>
        </div>
      </div>

      {slot.current_booking_id && (
        <div
          style={{
            background: "#FFFFFF",
            padding: "8px",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#64748B",
            marginBottom: "12px",
          }}
        >
          <div>
            <strong>User:</strong> {slot.current_user_name}
          </div>
          <div>
            <strong>Until:</strong> {new Date(slot.expires_at).toLocaleString()}
          </div>
        </div>
      )}

      {!bulkMode && (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => onToggle(slot.slot_id, slot.is_active)}
            disabled={slot.status === "occupied"}
            style={{
              flex: 1,
              padding: "8px",
              background: slot.status === "occupied" ? "#F3F4F6" : "#FFFFFF",
              color:
                slot.status === "occupied"
                  ? "#9CA3AF"
                  : slot.is_active
                  ? "#DC2626"
                  : "#22C55E",
              border: `1px solid ${
                slot.status === "occupied"
                  ? "#D1D5DB"
                  : slot.is_active
                  ? "#FCA5A5"
                  : "#BBF7D0"
              }`,
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: slot.status === "occupied" ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            {slot.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
            {slot.is_active ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => onOpenDelete(slot.slot_id)}
            disabled={slot.status === "occupied"}
            style={{
              padding: "8px",
              background: slot.status === "occupied" ? "#F3F4F6" : "#FFFFFF",
              color: slot.status === "occupied" ? "#9CA3AF" : "#EF4444",
              border: `1px solid ${
                slot.status === "occupied" ? "#D1D5DB" : "#FCA5A5"
              }`,
              borderRadius: "6px",
              fontSize: "12px",
              cursor: slot.status === "occupied" ? "not-allowed" : "pointer",
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * Custom props equality for SlotCard: compare only relevant fields.
 */
function areSlotPropsEqual(prevProps, nextProps) {
  const a = prevProps.slot;
  const b = nextProps.slot;

  const same =
    a.slot_id === b.slot_id &&
    a.slot_number === b.slot_number &&
    a.status === b.status &&
    a.is_active === b.is_active &&
    a.current_booking_id === b.current_booking_id &&
    a.current_user_name === b.current_user_name &&
    a.expires_at === b.expires_at;

  const handlersStable =
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onOpenDelete === nextProps.onOpenDelete &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.bulkMode === nextProps.bulkMode &&
    prevProps.isSelected === nextProps.isSelected;

  return same && handlersStable;
}

function SlotManagement() {
  const { spotId } = useParams();
  const navigate = useNavigate();

  const [spotInfo, setSpotInfo] = useState(null);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [slotsToAdd, setSlotsToAdd] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const token = localStorage.getItem("token");

  const isFirstLoadRef = useRef(true);
  const loadingRef = useRef(false);

  // Keep previous serialized data to avoid unnecessary state updates
  const slotsStringRef = useRef("");
  const spotInfoStringRef = useRef("");

  // Fetch spot details and slots
  const fetchData = useCallback(() => {
    // Prevent concurrent requests
    if (loadingRef.current) return;
    loadingRef.current = true;

    // Only show loading spinner on first load
    if (isFirstLoadRef.current) {
      setLoading(true);
    } else {
      setIsUpdating(true);
    }

    // Fetch spot details
    fetch(`http://localhost:5000/api/spots/${spotId}/details`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const next = safeStringify(data);
        if (next !== spotInfoStringRef.current) {
          spotInfoStringRef.current = next;
          setSpotInfo(data);
        }
      })
      .catch(() => setMessage("Failed to load spot details"));

    // Fetch slots
    fetch(`http://localhost:5000/api/slots/parking-spot/${spotId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const next = safeStringify(data);
        if (next !== slotsStringRef.current) {
          slotsStringRef.current = next;
          setSlots(data);
        }
        if (isFirstLoadRef.current) {
          setLoading(false);
          isFirstLoadRef.current = false;
        }
        setIsUpdating(false);
        loadingRef.current = false;
      })
      .catch(() => {
        setMessage("Failed to load slots");
        if (isFirstLoadRef.current) {
          setLoading(false);
          isFirstLoadRef.current = false;
        }
        setIsUpdating(false);
        loadingRef.current = false;
      });
  }, [spotId, token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Add new slots
  const handleAddSlots = useCallback(() => {
    if (slotsToAdd < 1 || slotsToAdd > 50) {
      setMessage("Can add between 1 and 50 slots at a time");
      return;
    }

    fetch(`http://localhost:5000/api/slots/parking-spot/${spotId}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ count: slotsToAdd }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        setSlotsToAdd(1);
        fetchData();
      })
      .catch(() => setMessage("Failed to add slots"));
  }, [slotsToAdd, spotId, token, fetchData]);

  // Toggle slot availability
  const handleToggleSlot = useCallback(
    (slotId, currentStatus) => {
      fetch(`http://localhost:5000/api/slots/${slotId}/toggle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      })
        .then((res) => res.json())
        .then((data) => {
          setMessage(data.message);
          fetchData();
        })
        .catch(() => setMessage("Failed to toggle slot"));
    },
    [token, fetchData]
  );

  // Delete slot
  const handleDeleteSlot = useCallback(
    (slotId) => {
      fetch(`http://localhost:5000/api/slots/${slotId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setMessage(data.message);
          setDeleteConfirm(null);
          fetchData();
        })
        .catch(() => setMessage("Failed to delete slot"));
    },
    [token, fetchData]
  );

  // Toggle slot selection for bulk operations
  const handleSelectSlot = useCallback((slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  }, []);

  // Select all slots
  const handleSelectAll = useCallback(() => {
    setSelectedSlots(slots.map((s) => s.slot_id));
  }, [slots]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedSlots([]);
    setBulkMode(false);
  }, []);

  // Bulk enable all available slots
  const handleBulkEnableAll = useCallback(() => {
    const availableSlotIds = slots
      .filter((s) => s.status !== "occupied" && !s.is_active)
      .map((s) => s.slot_id);

    if (availableSlotIds.length === 0) {
      setMessage("No slots available to enable");
      return;
    }

    Promise.all(
      availableSlotIds.map((slotId) =>
        fetch(`http://localhost:5000/api/slots/${slotId}/toggle`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_active: true }),
        })
      )
    )
      .then(() => {
        setMessage(`Successfully enabled ${availableSlotIds.length} slots`);
        fetchData();
      })
      .catch(() => setMessage("Failed to enable all slots"));
  }, [slots, token, fetchData]);

  // Bulk disable all slots
  const handleBulkDisableAll = useCallback(() => {
    const disableableSlots = slots
      .filter((s) => s.status !== "occupied" && s.is_active)
      .map((s) => s.slot_id);

    if (disableableSlots.length === 0) {
      setMessage("No slots available to disable");
      return;
    }

    Promise.all(
      disableableSlots.map((slotId) =>
        fetch(`http://localhost:5000/api/slots/${slotId}/toggle`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_active: false }),
        })
      )
    )
      .then(() => {
        setMessage(`Successfully disabled ${disableableSlots.length} slots`);
        fetchData();
      })
      .catch(() => setMessage("Failed to disable all slots"));
  }, [slots, token, fetchData]);

  // Bulk delete selected slots
  const handleBulkDelete = useCallback(() => {
    if (selectedSlots.length === 0) {
      setMessage("No slots selected");
      return;
    }

    const deleteableSlots = slots.filter(
      (s) => selectedSlots.includes(s.slot_id) && s.status !== "occupied"
    );

    if (deleteableSlots.length === 0) {
      setMessage("Selected slots cannot be deleted (occupied or invalid)");
      return;
    }

    if (
      !window.confirm(
        `Delete ${deleteableSlots.length} slot(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    Promise.all(
      deleteableSlots.map((slot) =>
        fetch(`http://localhost:5000/api/slots/${slot.slot_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    )
      .then(() => {
        setMessage(`Successfully deleted ${deleteableSlots.length} slots`);
        setSelectedSlots([]);
        setBulkMode(false);
        fetchData();
      })
      .catch(() => setMessage("Failed to delete selected slots"));
  }, [selectedSlots, slots, token, fetchData]);

  // Range enable/disable
  const handleRangeToggle = useCallback(
    (enable) => {
      const start = parseInt(rangeStart);
      const end = parseInt(rangeEnd);

      if (!start || !end || start > end) {
        setMessage("Invalid range. Start must be less than or equal to end.");
        return;
      }

      const slotsInRange = slots.filter(
        (s) =>
          s.slot_number >= start &&
          s.slot_number <= end &&
          s.status !== "occupied"
      );

      if (slotsInRange.length === 0) {
        setMessage(`No valid slots found in range ${start}-${end}`);
        return;
      }

      Promise.all(
        slotsInRange.map((slot) =>
          fetch(`http://localhost:5000/api/slots/${slot.slot_id}/toggle`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ is_active: enable }),
          })
        )
      )
        .then(() => {
          setMessage(
            `Successfully ${enable ? "enabled" : "disabled"} ${
              slotsInRange.length
            } slots (${start}-${end})`
          );
          setRangeStart("");
          setRangeEnd("");
          fetchData();
        })
        .catch(() => setMessage("Failed to update range"));
    },
    [rangeStart, rangeEnd, slots, token, fetchData]
  );

  // Open delete confirmation (stable reference)
  const handleOpenDelete = useCallback(
    (slotId) => setDeleteConfirm(slotId),
    []
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "20px 32px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "8px",
          }}
        >
          <button
            onClick={() => navigate("/owner/dashboard")}
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.target.style.background = "#F8FAFC")}
          >
            <ArrowLeft size={20} color="#475569" />
          </button>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: "600",
                color: "#1E293B",
              }}
            >
              {spotInfo?.name || "Loading..."}
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "14px",
                color: "#64748B",
              }}
            >
              Manage individual parking slots
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <button
            onClick={fetchData}
            style={{
              background: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          {isUpdating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#64748B",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#3B82F6",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              ></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {/* Message */}
        {message && (
          <div
            style={{
              background:
                message.includes("Failed") || message.includes("Cannot")
                  ? "#FEF2F2"
                  : "#F0FDF4",
              color:
                message.includes("Failed") || message.includes("Cannot")
                  ? "#DC2626"
                  : "#16A34A",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "20px",
              border: `1px solid ${
                message.includes("Failed") || message.includes("Cannot")
                  ? "#FCA5A5"
                  : "#BBF7D0"
              }`,
            }}
          >
            {message}
          </div>
        )}

        {/* Stats Cards */}
        {spotInfo && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748B",
                  marginBottom: "8px",
                }}
              >
                Total Slots
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "600",
                  color: "#1E293B",
                }}
              >
                {spotInfo.total_slots}
              </div>
            </div>
            <div
              style={{
                background: "#FFFFFF",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #BBF7D0",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#15803D",
                  marginBottom: "8px",
                }}
              >
                Available
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "600",
                  color: "#22C55E",
                }}
              >
                {spotInfo.available_slots}
              </div>
            </div>
            <div
              style={{
                background: "#FFFFFF",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #FCA5A5",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#DC2626",
                  marginBottom: "8px",
                }}
              >
                Occupied
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "600",
                  color: "#EF4444",
                }}
              >
                {spotInfo.occupied_slots || 0}
              </div>
            </div>
            <div
              style={{
                background: "#FFFFFF",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #D1D5DB",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748B",
                  marginBottom: "8px",
                }}
              >
                Active Slots
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "600",
                  color: "#1E293B",
                }}
              >
                {spotInfo.active_slots}
              </div>
            </div>
          </div>
        )}

        {/* Add Slots Panel */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#1E293B",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={18} />
            Add New Slots
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Number of Slots to Add
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={slotsToAdd}
                onChange={(e) => setSlotsToAdd(parseInt(e.target.value) || 1)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "12px",
                  color: "#64748B",
                }}
              >
                Add between 1 and 50 slots
              </p>
            </div>
            <button
              onClick={handleAddSlots}
              style={{
                padding: "10px 20px",
                background: "#1E293B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={16} />
              Add Slots
            </button>
          </div>
        </div>
        {/* Bulk Operations Panel */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#1E293B",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Bulk Operations
          </h3>

          {/* Bulk Mode Toggle */}
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
                if (bulkMode) setSelectedSlots([]);
              }}
              style={{
                padding: "10px 16px",
                background: bulkMode ? "#3B82F6" : "#FFFFFF",
                color: bulkMode ? "#FFFFFF" : "#1E293B",
                border: `1px solid ${bulkMode ? "#3B82F6" : "#D1D5DB"}`,
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              {bulkMode ? "Exit Bulk Mode" : "Enter Bulk Mode"}
            </button>
            {bulkMode && (
              <span
                style={{
                  marginLeft: "12px",
                  fontSize: "14px",
                  color: "#64748B",
                }}
              >
                {selectedSlots.length} slot(s) selected
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={handleBulkEnableAll}
              style={{
                padding: "12px",
                background: "#ECFDF5",
                color: "#16A34A",
                border: "1px solid #BBF7D0",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Enable All Available
            </button>
            <button
              onClick={handleBulkDisableAll}
              style={{
                padding: "12px",
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FCA5A5",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Disable All Available
            </button>
          </div>

          {/* Bulk Mode Actions */}
          {bulkMode && (
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleSelectAll}
                style={{
                  padding: "8px 16px",
                  background: "#FFFFFF",
                  color: "#1E293B",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Select All
              </button>
              <button
                onClick={handleClearSelection}
                style={{
                  padding: "8px 16px",
                  background: "#FFFFFF",
                  color: "#1E293B",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedSlots.length === 0}
                style={{
                  padding: "8px 16px",
                  background:
                    selectedSlots.length === 0 ? "#F3F4F6" : "#EF4444",
                  color: selectedSlots.length === 0 ? "#9CA3AF" : "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor:
                    selectedSlots.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Delete Selected ({selectedSlots.length})
              </button>
            </div>
          )}

          {/* Range Operations */}
          <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "16px" }}>
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: "600",
                color: "#1E293B",
              }}
            >
              Range Operations
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 2fr",
                gap: "12px",
                alignItems: "end",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#64748B",
                    marginBottom: "4px",
                  }}
                >
                  From Slot #
                </label>
                <input
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  placeholder="1"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#64748B",
                    marginBottom: "4px",
                  }}
                >
                  To Slot #
                </label>
                <input
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  placeholder="10"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleRangeToggle(true)}
                  disabled={!rangeStart || !rangeEnd}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background:
                      !rangeStart || !rangeEnd ? "#F3F4F6" : "#22C55E",
                    color: !rangeStart || !rangeEnd ? "#9CA3AF" : "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor:
                      !rangeStart || !rangeEnd ? "not-allowed" : "pointer",
                  }}
                >
                  Enable Range
                </button>
                <button
                  onClick={() => handleRangeToggle(false)}
                  disabled={!rangeStart || !rangeEnd}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background:
                      !rangeStart || !rangeEnd ? "#F3F4F6" : "#EF4444",
                    color: !rangeStart || !rangeEnd ? "#9CA3AF" : "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor:
                      !rangeStart || !rangeEnd ? "not-allowed" : "pointer",
                  }}
                >
                  Disable Range
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Slots Grid */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#1E293B",
            }}
          >
            All Slots ({slots.length})
          </h3>

          {loading ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#64748B" }}
            >
              Loading slots...
            </div>
          ) : slots.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#64748B" }}
            >
              No slots found
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {slots.map((slot) => (
                <SlotCard
                  key={slot.slot_id}
                  slot={slot}
                  onToggle={handleToggleSlot}
                  onOpenDelete={handleOpenDelete}
                  bulkMode={bulkMode}
                  isSelected={selectedSlots.includes(slot.slot_id)}
                  onSelect={handleSelectSlot}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={24} color="#EF4444" />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1E293B",
                  }}
                >
                  Delete Slot
                </h3>
              </div>
            </div>
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              Are you sure you want to delete this slot? This action cannot be
              undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: "10px 16px",
                  background: "#FFFFFF",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSlot(deleteConfirm)}
                style={{
                  padding: "10px 16px",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
    </div>
  );
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return "";
  }
}

export default SlotManagement;
