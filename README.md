# NearNeed

> **Google Maps tells you where things are. NearNeed tells you who can solve your problem nearby, right now.**

[![Live App](https://img.shields.io/badge/Live%20App-nearneed.floot.app-111827?style=for-the-badge)](https://nearneed.floot.app)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat-square&logo=react&logoColor=111827)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 🚀 Live

**[Open NearNeed → https://nearneed.floot.app](https://nearneed.floot.app)**

NearNeed is a hyper-local, real-time micro-need network for finding nearby people or shops that can solve an immediate need.

Examples:
- Need a drill for 30 minutes
- Need a jump-start cable nearby
- Need an urgent printout
- Need a specific hardware, electrical, plumbing, or creator accessory
- Need a tripod or other equipment nearby

Instead of searching only for businesses, NearNeed matches a request with **people/items that are actually available nearby**.

## ✨ Core Experience

**Need → Location → Match → Request → Accept → Contact → Handover → Complete → Rating**

### Discover
- Natural-language need search
- Location-aware nearby matching
- Configurable search radius
- Distance-aware results
- Provider/item cards with availability, price and rating
- Live radar-style discovery

### Virtual Toolbox
Users can list items they own and are willing to share or rent:
- Drill Machine
- Step Ladder
- Jumper Cable
- Extension Board
- Tripod
- Tool Kit
- Other useful equipment

Each listing can include description, price, pricing unit, availability and contact preference.

### Requests & Activity
- Send an item request with a message
- Provider receives an in-app notification
- Accept or decline requests
- Accepted requests reveal permitted contact details
- Mark completed handovers
- Track sent and received requests

### Notifications
NearNeed is designed for:
- In-app request alerts
- Real-time updates
- Browser/mobile push notifications where permission is enabled

## 🧭 Matching

The matching layer considers:
- What the requester needs
- Nearby distance
- Availability
- Item/provider information
- Request status

The goal is not to promise a guaranteed response time, but to surface **real nearby availability quickly**.

## 🏗️ Architecture

- **Frontend:** React + TypeScript + Vite
- **UI:** Responsive dark-first interface with Framer Motion
- **Backend:** Floot-managed APIs and services
- **Database:** PostgreSQL
- **Authentication:** Email/password + Google OAuth
- **Realtime:** Floot Realtime
- **Push:** Browser/mobile push subscriptions
- **Maps/places fallback:** OpenStreetMap/Photon
- **PWA:** Installable web experience

## 📦 Main Modules

| Module | Purpose |
|---|---|
| Discover | Search for immediate nearby needs |
| Live Radar | Visualize nearby matches |
| Toolbox | Manage shareable/rentable items |
| Activity | Manage requests and handovers |
| Notifications | Surface incoming requests |
| Profile | Account, stats and notification settings |

## 🔐 Trust & Safety

NearNeed is designed around explicit availability and request-based contact rather than unrestricted personal discovery.

The platform can support:
- User identity/profile information
- Ratings and Karma
- Availability status
- Request lifecycle tracking
- Controlled contact disclosure

Medical equipment, medicines and other regulated/high-risk categories should not be treated as ordinary peer-to-peer rentals.

## 💡 Launch Strategy

A practical initial rollout is a concentrated community such as:
- One gated society
- One hostel
- One university/campus
- One office/business community

A focused launch can create enough local supply and demand for the matching experience to become useful before expanding geographically.

## 💰 Potential Business Model

Possible future revenue streams:
- Shop/provider subscription plans
- Transaction commissions
- Premium discovery or business tools
- Community partnerships

These are product hypotheses, not current guarantees.

## 📱 Product Vision

NearNeed aims to become a local **real-time problem-solving network** where the important question is not:

> “Where can I buy this?”

but:

> “Who nearby has this and can help me right now?”

## 📊 Project Status

**Active development.**

Current product areas include discovery, nearby matching, virtual toolbox, request lifecycle, profiles, activity tracking and notifications.

## 🔗 Links

- **Live app:** https://nearneed.floot.app
- **Source code:** https://github.com/abhaykumarcse/NearNeed

## 👤 Author

**Abhay Kumar**

Built as an independent product project focused on solving hyper-local, time-sensitive everyday needs.
