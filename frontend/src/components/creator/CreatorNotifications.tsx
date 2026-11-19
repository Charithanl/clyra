"use client";

import Link from "next/link";
import { Bell, Check, CheckCheck, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getNotificationsForRecipient,
  getUnreadNotificationCount,
  markAllNotificationsReadForRecipient,
  markNotificationReadForRecipient,
} from "@/lib/shared/services";
import { getCurrentCreatorIdentity } from "@/lib/shared/identity";
import type { Notification } from "@/types/shared";
import "./creator-insights.css";

type NotificationCategory = "Campaigns" | "Invitations" | "Applications" | "Submissions" | "Performance" | "System";
type CreatorNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  href?: string;
  action?: string;
};

const categories = ["All", "Unread", "Campaigns", "Invitations", "Applications", "Submissions", "Performance", "System"];

function categoryFor(notification: Notification): NotificationCategory {
  const type = notification.type.toUpperCase();
  if (type.includes("INVITATION")) return "Invitations";
  if (type.includes("APPLICATION")) return "Applications";
  if (type.includes("SUBMISSION") || type.includes("CONTENT_REVIEW")) return "Submissions";
  if (type.includes("CAMPAIGN")) return "Campaigns";
  if (type.includes("PERFORMANCE") || type.includes("ANALYTIC")) return "Performance";
  return "System";
}

function destinationFor(notification: Notification) {
  if (!notification.relatedEntityId) return undefined;
  switch (notification.relatedEntityType?.toLowerCase()) {
    case "contentsubmission": return `/creator/submissions/${encodeURIComponent(notification.relatedEntityId)}`;
    case "campaigninvitation": return "/creator/invitations";
    case "campaign": return `/creator/campaigns/${encodeURIComponent(notification.relatedEntityId)}`;
    default: return undefined;
  }
}

function toViewModel(notification: Notification): CreatorNotification {
  return {
    id: notification.id,
    category: categoryFor(notification),
    title: notification.title,
    description: notification.message,
    timestamp: new Date(notification.createdAt).toLocaleString(),
    read: notification.isRead,
    href: destinationFor(notification),
    action: "View details",
  };
}

export default function CreatorNotifications() {
  const recipientId = getCurrentCreatorIdentity().userId;
  const [items, setItems] = useState<CreatorNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    try {
      setItems(getNotificationsForRecipient(recipientId).map(toViewModel));
      setUnreadCount(getUnreadNotificationCount(recipientId));
      setError("");
    } catch {
      setError("Notifications could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [recipientId]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => items.filter((item) =>
    (category === "All" || (category === "Unread" ? !item.read : item.category === category))
    && `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [category, items, query]);

  const markRead = (id: string) => {
    try {
      const updated = markNotificationReadForRecipient(recipientId, id);
      if (!updated) {
        setError("That notification is no longer available in your inbox.");
        refresh();
        return;
      }
      refresh();
    } catch {
      setError("The notification could not be updated.");
    }
  };

  const markAllRead = () => {
    try {
      markAllNotificationsReadForRecipient(recipientId);
      refresh();
    } catch {
      setError("Notifications could not be updated.");
    }
  };

  return <div className="creator-content notifications-page">
    <section className="discovery-hero"><div><div className="creator-overline">YOUR INBOX</div><h1>Notifications</h1><p>Stay updated on your campaigns, collaborations and content reviews.</p></div><button className="creator-secondary" onClick={markAllRead} disabled={unreadCount === 0 || loading}><CheckCheck size={14} /> Mark all as read</button></section>
    {error ? <p className="onboarding-error" role="alert">{error}</p> : null}
    <div className="notification-summary"><Summary label="Total notifications" value={items.length} /><Summary label="Unread" value={unreadCount} tone="yellow" /><Summary label="Campaign updates" value={items.filter((item) => item.category === "Campaigns").length} /><Summary label="Submission updates" value={items.filter((item) => item.category === "Submissions").length} tone="sage" /></div>
    <div className="notification-toolbar"><label className="discovery-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notifications..." /></label></div>
    <div className="notification-tabs">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
    <div className="notification-list">{loading ? <div className="creator-card collab-empty"><Bell size={22} /><h2>Loading notifications</h2></div> : filtered.length ? filtered.map((item) => <NotificationCard item={item} onMarkRead={() => markRead(item.id)} key={item.id} />) : <div className="creator-card collab-empty"><Bell size={22} /><h2>You&apos;re all caught up</h2><p>No notifications match this view.</p></div>}</div>
  </div>;
}

function Summary({ label, value, tone }: { label: string; value: number; tone?: string }) { return <article className={`notification-summary-card ${tone ?? ""}`}><small>{label}</small><b>{value}</b></article>; }
function NotificationCard({ item, onMarkRead }: { item: CreatorNotification; onMarkRead: () => void }) {
  return <article className={item.read ? "notification-card" : "notification-card unread"}><span className="notification-icon"><Bell size={15} /></span><div className="notification-copy"><div><span className="creator-overline">{item.category}</span><time>{item.timestamp}</time></div><h2>{item.title}</h2><p>{item.description}</p>{item.href ? <Link href={item.href}>{item.action ?? "View details"} →</Link> : null}</div><div className="notification-actions">{!item.read ? <button onClick={onMarkRead} title="Mark as read" aria-label="Mark notification as read"><Check size={13} /></button> : null}</div></article>;
}
