# StayFinder Test Cases

This document provides practical manual test cases for college project submission and viva demonstration.

## Test Case Format

- `ID`
- `Module`
- `Scenario`
- `Steps`
- `Expected Result`

## Authentication

### TC-01 Register a User

- Module: Authentication
- Scenario: New user registration
- Steps:
  1. Open `/register`
  2. Enter valid name, email, phone, password, and role `user`
  3. Submit form
- Expected Result:
  - Account is created
  - User is redirected appropriately
  - Success feedback is shown

### TC-02 Login with Valid Credentials

- Module: Authentication
- Scenario: Existing user login
- Steps:
  1. Open `/login`
  2. Enter valid email and password
  3. Submit form
- Expected Result:
  - User logs in successfully
  - Token is stored
  - User is redirected to the correct panel/page

### TC-03 Login with Invalid Credentials

- Module: Authentication
- Scenario: Wrong password or email
- Steps:
  1. Open `/login`
  2. Enter invalid credentials
  3. Submit form
- Expected Result:
  - Error message is displayed
  - Login is not completed

## User Module

### TC-04 Search PG Listings

- Module: User
- Scenario: Filter PG list
- Steps:
  1. Open `/listings`
  2. Select city, price, or gender filters
- Expected Result:
  - Listings update according to filters

### TC-05 View PG Detail

- Module: User
- Scenario: Open listing details
- Steps:
  1. Open a listing from the PG list
- Expected Result:
  - Gallery, title, location, price, amenities, and review section are shown

### TC-06 Add to Wishlist

- Module: User
- Scenario: Save listing to wishlist
- Steps:
  1. Login as user
  2. Open a PG detail page
  3. Click `Add to Wishlist`
- Expected Result:
  - Listing is added to wishlist
  - Success message is shown

### TC-07 Submit Review

- Module: User
- Scenario: Post review for PG
- Steps:
  1. Login as user
  2. Open a PG detail page
  3. Select rating and enter comment
  4. Submit review
- Expected Result:
  - Review is saved
  - Review appears in the review list

## Booking and Payment

### TC-08 Create Booking

- Module: Booking
- Scenario: Book an approved PG
- Steps:
  1. Login as user
  2. Open PG detail page
  3. Click `Book Now`
  4. Select check-in date and duration
  5. Continue
- Expected Result:
  - Booking is created
  - Payment page opens

### TC-09 Simulate Successful Payment

- Module: Payment
- Scenario: Mark payment successful
- Steps:
  1. Open payment page
  2. Choose payment method
  3. Enter required details
  4. Click success action
- Expected Result:
  - Payment status updates
  - Booking status reflects successful payment flow

### TC-10 Simulate Failed Payment

- Module: Payment
- Scenario: Mark payment failed
- Steps:
  1. Open payment page
  2. Click failure action
- Expected Result:
  - Payment failure message is shown
  - Booking/payment status updates correctly

## Owner Module

### TC-11 Add PG Listing

- Module: Owner
- Scenario: Create new PG
- Steps:
  1. Login as owner
  2. Open `Add PG`
  3. Fill all required details
  4. Upload images
  5. Submit
- Expected Result:
  - PG is created
  - Listing appears in owner manage page
  - Approval is pending

### TC-12 Edit PG Listing

- Module: Owner
- Scenario: Update existing PG
- Steps:
  1. Login as owner
  2. Open `Manage PGs`
  3. Edit title, price, or rooms
  4. Save
- Expected Result:
  - Listing is updated
  - Success message is shown

## Admin Module

### TC-13 Approve PG Listing

- Module: Admin
- Scenario: Approve owner-submitted listing
- Steps:
  1. Login as admin
  2. Open `Approve PG`
  3. Click `Approve`
- Expected Result:
  - PG is approved
  - It disappears from pending approval queue

### TC-14 Manage Booking Status

- Module: Admin
- Scenario: Change booking status from admin panel
- Steps:
  1. Login as admin
  2. Open `Bookings`
  3. Choose a booking
  4. Click `Confirm`, `Pending`, or `Cancel`
- Expected Result:
  - Booking status updates correctly
  - Message confirms action

### TC-15 Delete User

- Module: Admin
- Scenario: Remove user account
- Steps:
  1. Login as admin
  2. Open `Users`
  3. Click `Delete` for a non-admin user
- Expected Result:
  - User is removed from the list
  - Success message is displayed

### TC-16 Delete Contact Message

- Module: Admin
- Scenario: Remove contact entry
- Steps:
  1. Login as admin
  2. Open `Users`
  3. Delete a contact message
- Expected Result:
  - Contact message disappears from the table

## Contact Module

### TC-17 Send Contact Message

- Module: Contact
- Scenario: User sends support message
- Steps:
  1. Open `/contact`
  2. Fill name, email, subject, and message
  3. Submit form
- Expected Result:
  - Message is stored successfully
  - Success message is shown
  - Admin can see it later

## Responsive UI

### TC-18 Mobile Responsiveness

- Module: UI
- Scenario: Verify mobile layout
- Steps:
  1. Open the site in browser responsive mode
  2. Test Home, Listings, PG Detail, Booking, Admin pages
- Expected Result:
  - Content stays inside the screen
  - Tables scroll correctly where necessary
  - Navigation remains usable

## Final Submission Note

For report submission, you can take screenshots of each successful test result and attach them under the testing chapter.
