# 04 — Notifications

**Status:** Planned  
**Route:** `/dashboard/notifications`

## Overview

An in-app notification system with an inbox view, toast popups, and read/unread state management. Demonstrates real-time UI updates and state persistence patterns.

## Planned features

- Notification inbox page listing all notifications (newest first)
- Read/unread state with visual distinction (bold/normal text, dot indicator)
- Mark individual notifications as read
- Mark all as read
- Toast notifications for new items (non-blocking popups)
- Notification count badge in sidebar
- Notification types: system alerts, module activity, account events

## Open questions

- Real-time delivery mechanism (polling, SSE, or WebSocket)
- Notification data schema
- Toast auto-dismiss timing
- Whether to support notification preferences/filters

## Test cases

### Inbox
- [ ] Notifications page shows all notifications, newest first
- [ ] Unread notifications are visually distinct (bold, dot indicator)
- [ ] Click a notification → marks it as read, visual change immediate
- [ ] "Mark all as read" → all notifications lose unread styling
- [ ] Empty state shown when no notifications exist

### Toast notifications
- [ ] New notification triggers a toast popup
- [ ] Toast auto-dismisses after a set duration
- [ ] Toast can be manually dismissed
- [ ] Toast does not block page interaction
- [ ] Multiple toasts stack without overlapping

### Badge / count
- [ ] Sidebar shows unread count badge next to Notifications link
- [ ] Badge updates when notifications are read
- [ ] Badge disappears when all are read
- [ ] Badge shows "9+" for counts above 9

### Edge cases
- [ ] Unauthenticated user → redirected to login
- [ ] Notification with long text → truncated in list, full text on click/expand
- [ ] Rapid mark-as-read clicks → no duplicate requests, state consistent
- [ ] Page refresh → read/unread state persisted from database
