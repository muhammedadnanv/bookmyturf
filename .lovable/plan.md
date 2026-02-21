

# Book My Turf — Phase 1 MVP Plan

## Overview
A turf booking marketplace where Owners list turfs, Players search and book slots, and Admins oversee the platform. Built with React + Supabase (auth, database, edge functions, storage).

---

## 1. Authentication & Role-Based Access
- Email/password signup with role selection (Player or Owner)
- JWT-based auth via Supabase Auth
- Roles stored in a separate `user_roles` table (admin, owner, player)
- Profiles table for user details (name, phone, avatar)
- Protected routes based on role — players, owners, and admins each see different dashboards

## 2. Turf Listing & Management (Owner)
- **Create Turf**: Form with name, description, location (city/area), sport type, amenities (checklist), hourly pricing, and image uploads (Supabase Storage)
- **Manage Turfs**: Owner dashboard to view, edit, and deactivate their listings
- **Admin Approval**: New listings start as "pending" — Admin approves before they appear publicly
- **Turf Detail Page**: Public-facing page with images, amenities, pricing, and slot calendar

## 3. Slot System & Booking Flow
- **Slot Configuration**: Owners define available time slots per day (e.g., 6AM-7AM, 7AM-8AM) with pricing
- **Real-Time Availability**: Players see which slots are available, booked, or blocked
- **Double-Booking Prevention**: Database-level locking using Supabase transactions and unique constraints (no Redis needed for MVP — database constraints are sufficient)
- **Booking Flow**: Player selects turf → picks date → selects available slot → confirms booking
- **Booking Status**: Pending → Confirmed → Completed / Cancelled

## 4. Search & Discovery (Player)
- Browse turfs with filters: location (city/area), sport type, price range
- Search bar for turf name
- Turf cards showing name, location, price, rating placeholder, and image

## 5. Payment (Mock for MVP)
- Mock Razorpay checkout UI — simulates payment flow
- On "payment success," booking is confirmed automatically
- **Commission Engine**: 10% platform commission calculated and stored per booking
- **Payout Ledger**: Table tracking owner earnings, commission deducted, and pending payouts (viewable by owner and admin)

## 6. Player Dashboard
- View upcoming and past bookings
- Cancel bookings (with policy rules)
- Basic profile management

## 7. Owner Dashboard
- View all bookings for their turfs
- Revenue summary: total earnings, commission deducted, net payout
- Manage turf listings and slot availability

## 8. Admin Dashboard
- Approve/reject turf listings
- View all bookings platform-wide
- Revenue overview: total platform commission, booking volume
- Manage commission rate settings
- User management (view players and owners)

## 9. UI & Design
- Clean, modern sports-themed design with green/dark accents
- Fully responsive (mobile-first for players)
- Toast notifications for booking confirmations, errors
- Loading states and empty states throughout

