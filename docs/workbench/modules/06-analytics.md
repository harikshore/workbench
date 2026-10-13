# 06 — Analytics

**Status:** Planned  
**Route:** `/dashboard/analytics`

## Overview

A personal analytics dashboard built from the user's own activity within the app. Charts and metrics visualize sign-in history, module usage, profile changes, and other tracked events. Demonstrates data visualization, aggregation, and dashboard layout patterns.

## Planned features

- Activity timeline: sign-ins, module visits, profile updates
- Charts: bar charts, line charts, or sparklines for activity over time
- Key metrics: total sign-ins, days active, modules explored
- Date range selector for filtering chart data
- Responsive card-based layout following Modernist design system

## Open questions

- Charting library (recharts, chart.js, or custom SVG)
- What events to track beyond sign-ins (page views, module interactions)
- Data retention period (given 5-day user cleanup, analytics scope is limited for demo users)
- Whether to pre-aggregate data or compute on read

## Test cases

### Dashboard display
- [ ] Analytics page loads with charts and metric cards
- [ ] Metrics show correct counts (sign-ins, days active, etc.)
- [ ] Charts render with user's actual activity data
- [ ] Date range selector filters chart data correctly
- [ ] Responsive layout: cards reflow on mobile width

### Charts
- [ ] Bar/line chart shows activity over time
- [ ] Hover on data point → tooltip with details
- [ ] Empty chart state when no data for selected range
- [ ] Chart updates when date range changes

### Data accuracy
- [ ] Sign-in count matches actual sign-in history
- [ ] Activity timeline entries match real user actions
- [ ] New activity (e.g. sign-in) reflected on next page load

### Edge cases
- [ ] New user with no activity → empty state with explanation
- [ ] Unauthenticated user → redirected to login
- [ ] Date range with no data → "No activity in this period" shown
- [ ] Large activity history → page remains performant
