import React, { useEffect, useState } from "react";
import api from "../services/api"; // your global axios instance
import "./Notifications.css";

const Notifications = ({ showDropdown }) => {
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/"); // global api handles JWT
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Mark a notification as read
  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // WebSocket setup
  useEffect(() => {
    fetchNotifications();

    const token = localStorage.getItem("access"); // your JWT
    if (!token) return; // Don't connect if no token

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/notifications/?token=${token}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications((prev) => [data, ...prev]);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => ws.close();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`notifications-container ${showDropdown ? "dropdown" : ""}`}>
      {notifications.length === 0 ? (
        <p className="no-notifications">No notifications</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={`notification-item ${n.read ? "read" : "unread"}`}
          >
            <p>{n.message}</p>
            {n.link && (
              <a href={n.link} className="view-link">
                View
              </a>
            )}
            {!n.read && (
              <button onClick={() => markRead(n.id)} className="mark-btn">
                Mark as read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;
