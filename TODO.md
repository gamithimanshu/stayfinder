# StayFinder Complete Fix TODO
Status: 🔄 In Progress (BLACKBOXAI)

## Priority 1: Immediate Data Display 🟢 Backend Fixed
- [✅] Start server (node server/server.js running on 5000, DB connected)
- [ ] Start client (`cd client && npm run dev`)
- [✅] Edit server/controllers/pg-controller.js: Relax isApproved filter for dev (show all PGs)
- [ ] Seed/approve sample PGs (if DB empty)

## Priority 2: GPS System 📍 🟢 PGList Complete
- [✅] Add Leaflet CDN to client/index.html
- [✅] Create client/src/components/MapView.jsx (markers)
- [✅] Integrate map in PGList.jsx (list + map view)
- [ ] PGDetail.jsx embed map
- [ ] Forward geocoding search input

## Priority 3: Ratings/Reviews ⭐
- [ ] PG model: Virtual avgRating from reviews[]
- [ ] PGList/Home: Sort by rating
- [ ] PGDetail: Interactive stars, submit review

## Priority 4: Admin/Owner Full
- [ ] AdminDashboard.jsx: Fix fetches/pending lists
- [ ] ApprovePG.jsx: Approve/reject buttons working
- [ ] AddPG.jsx: Image upload, form validation
- [ ] OwnerDashboard.jsx: Manage listings

## Priority 5: All Pages Polish
- [ ] Wishlist/Booking/Payment/Profile/Users/Contact: Fix empties
- [ ] Pagination/infinite scroll PGList
- [ ] Error toasts global
- [ ] Mobile responsive fixes

## Priority 6: Testing/Complete
- [ ] End-to-end test all flows
- [ ] Seed production-like data
- [ ] attempt_completion

**Next Step: Starting servers + pg-controller edit**

