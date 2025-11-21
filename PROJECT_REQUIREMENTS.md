# Skipped - Construction Materials Marketplace
## Comprehensive Project Requirements Document

---

## 1. PROJECT OVERVIEW

**Project Name:** Skipped  
**Type:** Web-based marketplace for buying and selling construction materials  
**Primary Goal:** Sustainable marketplace connecting sellers of surplus construction materials with buyers, tracking environmental impact  
**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Supabase, Stripe

---

## 2. TECHNICAL STACK

### Frontend
- **Framework:** React 18.3.1 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom design system
- **UI Components:** Shadcn/ui (Radix UI primitives)
- **Routing:** React Router DOM 6.30.1
- **State Management:** TanStack Query 5.83.0
- **Form Handling:** React Hook Form 7.61.1 with Zod validation
- **Image Handling:** browser-image-compression 2.0.2

### Backend
- **BaaS:** Supabase (Database, Authentication, Storage, Edge Functions)
- **Database:** PostgreSQL with Row Level Security (RLS)
- **Authentication:** Supabase Auth (Email/Password, Email verification)
- **Storage:** Supabase Storage (listing-media, avatars, business-logos, environmental-certificates)
- **Edge Functions:** Deno-based serverless functions

### Third-Party Integrations
- **Payment Processing:** Stripe (Connect, Payment Intents, Checkout)
- **Maps:** Google Maps JavaScript API (location search, autocomplete, map display)
- **PDF Generation:** jsPDF 3.0.3
- **QR Codes:** qrcode 1.5.3
- **Charts:** Recharts 2.15.4

---

## 3. USER ROLES & PERMISSIONS

### 3.1 User (Default Role)
- Create and manage listings
- Browse and search marketplace
- Make offers and negotiate
- Complete purchases
- Message other users
- Leave and receive reviews
- Track environmental impact
- Manage favourites
- View transaction history

### 3.2 Admin Role
- All user permissions plus:
- Manage all users (suspend, restore, delete)
- Moderate listings
- Resolve disputes
- View platform analytics
- Manage blog posts and categories
- Configure platform settings
- Manage site banners
- Access system health monitoring
- View financial reports

---

## 4. DATABASE SCHEMA

### 4.1 Core Tables

#### profiles
- **Purpose:** Extended user information
- **Key Fields:**
  - user_id (UUID, references auth.users)
  - username (unique)
  - display_name
  - email
  - avatar_url
  - bio
  - location
  - company_name
  - business_logo_url
  - phone
  - verified (boolean)
  - identity_verified (boolean)
  - stripe_account_id
  - stripe_onboarding_complete
  - account_status (active/suspended)
  - suspension_reason
  - suspended_by
  - suspended_at
  - on_holiday (boolean)
  - holiday_start_date
  - holiday_end_date
  - holiday_message
  - last_active_at
  - email_notifications_enabled
  - email_new_message
  - email_new_offer
  - email_transaction_update
  - email_review_reminder

#### listings
- **Purpose:** Construction material listings
- **Key Fields:**
  - id (UUID)
  - seller_id (UUID, references profiles)
  - category_id (UUID, references categories)
  - title
  - description
  - price (numeric)
  - quantity (integer)
  - condition (new/used/refurbished)
  - manufacturer
  - images (text array)
  - location (text)
  - full_address (text, private)
  - public_location (text, visible to all)
  - latitude/longitude (numeric)
  - location_bounds (jsonb)
  - available (boolean)
  - featured (boolean)
  - status (active/sold/removed)
  - view_count
  - last_viewed_at
  - pickup_available (boolean)
  - delivery_available (boolean)
  - delivery_cost (numeric)
  - delivery_radius (integer, miles)
  - delivery_notes
  - collection_location
  - collection_notes
  - reason_for_selling
  - dimensions (jsonb: length, width, height, unit)
  - weight (numeric, kg)
  - carbon_saved (numeric)
  - calculation_confidence (low/medium/high)
  - environmental_assessment_enabled (boolean)
  - certificate_methodology (jsonb)
  - search_vector (tsvector for full-text search)

#### categories
- **Purpose:** Listing categorization
- **Key Fields:**
  - id (UUID)
  - name
  - slug (unique)
  - description
  - icon_name
  - item_count (auto-updated)

#### transactions
- **Purpose:** Purchase transactions
- **Key Fields:**
  - id (UUID)
  - listing_id (UUID)
  - buyer_id (UUID)
  - seller_id (UUID)
  - offer_id (UUID, optional)
  - amount (numeric)
  - delivery_cost (numeric)
  - delivery_method (pickup/delivery)
  - buyer_protection_fee (numeric)
  - status (pending/pending_payment/paid/dispatched/delivered/completed/disputed/refunded)
  - stripe_payment_intent_id
  - stripe_transfer_id
  - paid_at
  - dispatch_confirmed_at
  - delivery_confirmed_at
  - completed_at
  - disputed_at
  - dispute_id
  - dispute_reason
  - return_requested_at
  - return_confirmed_at
  - return_notes
  - refunded_at

#### offers
- **Purpose:** Price negotiation
- **Key Fields:**
  - id (UUID)
  - listing_id (UUID)
  - buyer_id (UUID)
  - seller_id (UUID)
  - parent_offer_id (UUID, for counter-offers)
  - amount (numeric)
  - message (text)
  - status (pending/accepted/declined/expired/withdrawn)
  - expires_at

#### messages
- **Purpose:** User communication
- **Key Fields:**
  - id (UUID)
  - sender_id (UUID)
  - receiver_id (UUID)
  - listing_id (UUID, optional)
  - transaction_id (UUID, optional)
  - offer_id (UUID, optional)
  - content (text)
  - message_type (message/offer/system)
  - read (boolean)

#### reviews
- **Purpose:** Buyer/seller feedback
- **Key Fields:**
  - id (UUID)
  - transaction_id (UUID)
  - listing_id (UUID)
  - reviewer_id (UUID)
  - seller_id (UUID)
  - reviewer_type (buyer/seller)
  - rating (1-5)
  - title
  - comment
  - seller_reply
  - seller_reply_created_at

#### disputes
- **Purpose:** Transaction dispute management
- **Key Fields:**
  - id (UUID)
  - transaction_id (UUID)
  - listing_id (UUID)
  - raised_by_id (UUID)
  - against_id (UUID)
  - dispute_type (item_not_received/item_not_as_described/refund_request/other)
  - reason
  - description
  - status (pending/under_review/resolved/rejected)
  - requested_amount (numeric)
  - approved_amount (numeric)
  - resolution_type (full_refund/partial_refund/no_refund)
  - admin_id (UUID)
  - admin_notes
  - resolved_at

#### dispute_evidence
- **Purpose:** Dispute supporting files
- **Key Fields:**
  - id (UUID)
  - dispute_id (UUID)
  - uploaded_by_id (UUID)
  - evidence_type (photo/document/correspondence)
  - file_url
  - description

#### environmental_certificates
- **Purpose:** Carbon impact certificates
- **Key Fields:**
  - id (UUID)
  - transaction_id (UUID)
  - listing_id (UUID)
  - buyer_id (UUID)
  - seller_id (UUID)
  - certificate_reference (unique)
  - material_type
  - material_weight_kg (numeric)
  - carbon_saved_kg (numeric)
  - landfill_diverted_kg (numeric)
  - calculation_method
  - carbon_factor_source
  - methodology_snapshot (jsonb)
  - buyer_certificate_url
  - seller_certificate_url
  - issued_at

#### favourites
- **Purpose:** User saved listings
- **Key Fields:**
  - id (UUID)
  - user_id (UUID)
  - listing_id (UUID)

#### notifications
- **Purpose:** User notifications
- **Key Fields:**
  - id (UUID)
  - user_id (UUID)
  - type (offer/message/transaction/review/system)
  - title
  - description
  - action_url
  - related_id (UUID)
  - metadata (jsonb)
  - read (boolean)

#### user_roles
- **Purpose:** Role assignment
- **Key Fields:**
  - id (UUID)
  - user_id (UUID)
  - role (user/admin enum)

#### blog_posts
- **Purpose:** News and resources
- **Key Fields:**
  - id (UUID)
  - author_id (UUID)
  - title
  - slug (unique)
  - excerpt
  - content (HTML/Markdown)
  - featured_image_url
  - status (draft/published/archived)
  - published_at
  - view_count
  - reading_time_minutes (auto-calculated)
  - meta_description
  - meta_keywords
  - search_vector (tsvector)

#### blog_categories
- **Purpose:** Blog categorization
- **Key Fields:**
  - id (UUID)
  - name
  - slug (unique)
  - description
  - icon_name
  - color
  - post_count (auto-updated)

#### blog_post_categories
- **Purpose:** Many-to-many blog-category relation
- **Key Fields:**
  - id (UUID)
  - post_id (UUID)
  - category_id (UUID)

#### blog_post_views
- **Purpose:** Blog analytics
- **Key Fields:**
  - id (UUID)
  - post_id (UUID)
  - user_id (UUID, optional)
  - session_id
  - ip_address
  - user_agent
  - viewed_at

#### blog_post_feedback
- **Purpose:** Blog helpfulness tracking
- **Key Fields:**
  - id (UUID)
  - post_id (UUID)
  - user_id (UUID, optional)
  - session_id
  - feedback_type (helpful/not_helpful enum)
  - comment

#### site_banners
- **Purpose:** Announcement banners
- **Key Fields:**
  - id (UUID)
  - message
  - banner_type (info/warning/success/error)
  - link_url
  - link_text
  - is_active (boolean)
  - start_date
  - end_date
  - view_count
  - click_count

#### saved_searches
- **Purpose:** User saved search criteria
- **Key Fields:**
  - id (UUID)
  - user_id (UUID)
  - name
  - search_criteria (jsonb)
  - notification_enabled (boolean)
  - active (boolean)

#### admin_actions
- **Purpose:** Admin activity audit
- **Key Fields:**
  - id (UUID)
  - admin_id (UUID)
  - target_user_id (UUID)
  - action_type (suspend/restore/delete/verify/etc)
  - reason
  - metadata (jsonb)

#### transaction_audit_log
- **Purpose:** Transaction change tracking
- **Key Fields:**
  - id (UUID)
  - transaction_id (UUID)
  - user_id (UUID)
  - action
  - old_status
  - new_status
  - metadata (jsonb)

#### account_deletion_requests
- **Purpose:** GDPR-compliant account deletion
- **Key Fields:**
  - id (UUID)
  - user_id (UUID)
  - status (pending/completed/cancelled)
  - reason
  - requested_at
  - scheduled_deletion_at (30 days from request)

#### rate_limit_log
- **Purpose:** Rate limiting tracking
- **Key Fields:**
  - id (UUID)
  - user_id (UUID, optional)
  - ip_address
  - action_type
  - metadata (jsonb)

#### platform_settings
- **Purpose:** Configurable platform settings
- **Key Fields:**
  - id (UUID)
  - setting_key (unique)
  - setting_value (jsonb)
  - description
  - updated_by (UUID)

### 4.2 Database Views

#### public_listings
- Filtered view of listings excluding sensitive data (full_address)
- Shows only active, available listings or user's own listings

#### public_safe_profiles
- Filtered view of profiles excluding sensitive data (email, phone, stripe_account_id)
- Shows only active accounts

#### public_reviews
- Enriched view joining reviews with reviewer/seller profile info
- Includes avatars, usernames, verification status

### 4.3 Database Functions

#### increment_listing_view_count(listing_id)
- Increments view count and updates last_viewed_at

#### is_user_on_holiday(user_id)
- Checks if user is currently on holiday

#### generate_username_suggestions(base_username)
- Returns array of available username suggestions

#### generate_blog_slug(title)
- Auto-generates unique URL-friendly slug from title

#### calculate_reading_time(content)
- Calculates estimated reading time in minutes

#### send_review_reminders()
- Scheduled function to send review reminders 7 days after completion

#### validate_transaction_amount(amount)
- Validates transaction amounts (max £100,000)

#### validate_refund_amount(refund_amount, transaction_amount)
- Validates refund amounts (max £50,000, must not exceed transaction)

#### has_role(user_id, role)
- Checks if user has specified role

### 4.4 Database Triggers

#### Auto-generate blog slug on insert
- Calls generate_blog_slug() before insert if slug is empty

#### Auto-calculate reading time on blog post insert/update
- Calls calculate_reading_time() before insert/update

#### Update blog category post count
- Increments/decrements post_count when post_categories change

#### Update listings search vector
- Updates full-text search vector on insert/update

#### Update blog_posts search vector
- Updates full-text search vector on insert/update

#### Create offer notification
- Automatically creates notification message when offer is created

#### Handle offer acceptance
- Creates system message when offer is accepted

#### Create offer system message
- Creates system message when offer status changes

#### Send holiday auto-response
- Automatically sends holiday message when user on holiday receives message

#### Log transaction status changes
- Logs all transaction status changes to audit log

#### Update updated_at timestamp
- Automatically updates updated_at on row changes

---

## 5. AUTHENTICATION & AUTHORIZATION

### 5.1 Authentication Methods
- **Email/Password:** Standard authentication
- **Email Verification:** Required before account activation
- **Password Reset:** Email-based password recovery

### 5.2 Session Management
- **Storage:** localStorage
- **Auto-refresh:** Enabled
- **Session persistence:** Enabled

### 5.3 Row Level Security (RLS) Policies

#### Profiles
- Users can view active profiles or their own
- Users can insert/update their own profile
- Admins can view all profiles

#### Listings
- Everyone can view active, available listings
- Sellers can view/edit/delete their own listings
- Buyers can view listings they've purchased

#### Transactions
- Buyers and sellers can view their own transactions
- Buyers and sellers can update transaction status
- Admins can view all transactions

#### Messages
- Users can view messages they sent or received
- Users can send messages (not system messages)
- Users can mark received messages as read

#### Offers
- Buyers can create offers
- Buyers and sellers can view offers they're involved in
- Buyers and sellers can update offer status

#### Reviews
- Users can create reviews for completed transactions
- Users can view/edit/delete their own reviews
- Sellers can add replies to reviews

#### Disputes
- Users can create disputes for their transactions
- Parties involved can view disputes
- Admins can update disputes

#### Favourites
- Users can create/view/delete their own favourites

#### Notifications
- Users can view/update their own notifications
- System can create notifications

#### Blog Posts
- Everyone can view published posts
- Authors and admins can view drafts
- Admins can create/update/delete posts

#### Blog Categories
- Everyone can view categories
- Admins manage categories

#### Site Banners
- Everyone can view active banners within date range
- Admins can view all banners

---

## 6. CORE FEATURES

### 6.1 User Registration & Profile Management

#### Registration
- Email/password sign-up
- Automatic username generation from email
- Email verification required
- Profile creation on sign-up

#### Profile Features
- Display name, username, bio
- Avatar upload
- Business logo upload (optional)
- Location
- Phone number
- Company name (optional)
- Email notification preferences
- Holiday mode with custom message
- Stripe Connect onboarding for sellers

#### Account Management
- Update profile information
- Change password
- Account deletion request (30-day grace period)
- Notification preferences

### 6.2 Listing Creation & Management

#### Create Listing
- **Basic Information:**
  - Title (required)
  - Description (required)
  - Category selection (required)
  - Price (required, max £100,000)
  - Quantity (default 1)
  - Condition (new/used/refurbished)
  - Manufacturer (optional)
  - Reason for selling (optional)

- **Images:**
  - Multiple image upload
  - Image compression
  - Drag and drop reordering
  - Main image selection

- **Location:**
  - Google Maps autocomplete
  - Full address (private)
  - Public location display (city/area only)
  - Latitude/longitude for distance calculations
  - Location bounds for map display

- **Delivery Options:**
  - Pickup availability
  - Delivery availability
  - Delivery radius (miles)
  - Delivery cost
  - Delivery notes
  - Collection location
  - Collection notes

- **Specifications:**
  - Dimensions (length, width, height, unit)
  - Weight (kg)

- **Environmental Assessment (Optional):**
  - Enable carbon impact calculation
  - Material type selection
  - Calculation confidence level
  - Certificate methodology configuration

#### Edit Listing
- All fields editable
- Mark as sold
- Delete listing
- View listing analytics (views, favourites)

#### Listing Features
- Featured listings (admin controlled)
- View counter
- Last viewed timestamp
- Full-text search indexing
- Availability status

### 6.3 Browse & Search

#### Search Features
- **Text Search:**
  - Full-text search across title, description, location, manufacturer
  - Weighted scoring (title > description > location)
  
- **Filters:**
  - Category filter
  - Price range (min/max)
  - Location (distance from user)
  - Condition filter
  - Delivery options (pickup/delivery available)
  - Featured only
  - Sort by: newest, price (low/high), distance

- **Search Suggestions:**
  - Popular search terms
  - Category quick links

- **Map View:**
  - Google Maps integration
  - Clustered markers
  - Info windows with listing preview
  - Distance calculation

#### Saved Searches
- Save search criteria
- Name custom searches
- Enable notifications for new matches
- Activate/deactivate searches

### 6.4 Favourites
- Add/remove listings to favourites
- View all favourited listings
- Quick access from dashboard

### 6.5 Offers & Negotiation

#### Make Offer
- Offer amount (must be less than listing price)
- Optional message to seller
- Offer expiry (optional)

#### Counter Offer
- Seller can counter with new amount
- Optional message
- Links to parent offer

#### Offer Management
- Accept offer (converts to transaction)
- Decline offer
- Withdraw offer (buyer only)
- View offer history
- Automatic notifications

### 6.6 Messaging System

#### Message Features
- Direct messaging between users
- Listing-specific conversations
- Transaction-specific conversations
- Offer-related messages (automatic)
- System messages (automatic)
- Unread indicator
- Message timestamp
- Holiday auto-responder

#### Message Organization
- Inbox view with conversation threads
- Filter by listing/transaction
- Mark as read/unread
- Real-time updates via Supabase subscriptions

### 6.7 Payment Processing (Stripe Integration)

#### Stripe Connect
- Seller onboarding flow
- Express account creation
- Account verification status
- Balance tracking
- Payout management

#### Payment Flow
1. **Buyer Initiates Purchase:**
   - Select delivery method
   - Review total cost (item + delivery + fees)
   - Create payment intent via edge function

2. **Stripe Checkout Session:**
   - Secure Stripe-hosted checkout
   - Card payment processing
   - Payment intent creation
   - Metadata storage (buyer, seller, listing, delivery method)

3. **Payment Verification:**
   - Webhook handling (payment_intent.succeeded)
   - Transaction creation
   - Listing status update
   - Notification generation

4. **Funds Hold:**
   - Platform holds payment
   - Released on delivery confirmation

5. **Seller Payout:**
   - Automatic transfer to seller Stripe account
   - Platform fee deduction
   - Transfer on completion

#### Payment Features
- Platform fee: Configurable percentage
- Buyer protection fee
- Secure card processing
- Payment intent tracking
- Refund capability
- Dispute handling
- Balance inquiries

### 6.8 Transaction Management

#### Transaction Lifecycle
1. **Pending Payment:** Created, awaiting payment
2. **Paid:** Payment successful, awaiting dispatch
3. **Dispatched:** Seller confirms shipment
4. **Delivered:** Buyer confirms receipt
5. **Completed:** Transaction finalized, review period
6. **Disputed:** Issue raised
7. **Refunded:** Payment returned to buyer

#### Transaction Features
- Status tracking
- Timeline visualization
- Audit log (all status changes)
- Dispute raising
- Return requests
- Delivery confirmation
- Completion triggers
- Automatic notifications at each stage

#### Buyer Actions
- Confirm delivery
- Raise dispute
- Request return
- Leave review (after completion)
- Download environmental certificate

#### Seller Actions
- Confirm dispatch
- Respond to disputes
- Process returns
- Leave review (after completion)
- View payout status

### 6.9 Reviews & Ratings

#### Review System
- **Who Can Review:**
  - Buyers can review sellers
  - Sellers can review buyers
  - Only after transaction completion

- **Review Components:**
  - Star rating (1-5, required)
  - Title (optional)
  - Comment (optional)
  - Reviewer type (buyer/seller)

- **Seller Reply:**
  - Sellers can reply to reviews
  - One reply per review
  - Reply timestamp

#### Review Display
- Average rating calculation
- Rating distribution
- Most recent reviews
- Verified purchase badge
- Helpful/not helpful voting

#### Review Reminders
- Automatic reminder 7 days after completion
- One-time reminder per transaction

### 6.10 Dispute Resolution

#### Dispute Types
- Item not received
- Item not as described
- Refund request
- Other

#### Dispute Process
1. **Raise Dispute:**
   - Buyer or seller initiates
   - Select dispute type
   - Provide reason and description
   - Optional refund amount request

2. **Upload Evidence:**
   - Photos
   - Documents
   - Correspondence
   - Both parties can upload

3. **Admin Review:**
   - Admin assigned to dispute
   - Reviews evidence
   - Contacts parties if needed
   - Makes decision

4. **Resolution:**
   - Full refund
   - Partial refund
   - No refund
   - Custom resolution

5. **Outcome:**
   - Refund processed (if approved)
   - Transaction status updated
   - Notifications sent
   - Dispute closed

### 6.11 Environmental Impact Tracking

#### Carbon Calculation
- **Material-specific factors:**
  - Bricks: 0.22 kg CO2/kg
  - Steel: 1.85 kg CO2/kg
  - Timber: 0.03 kg CO2/kg
  - Concrete: 0.13 kg CO2/kg
  - Other materials with custom factors

- **Calculation Formula:**
  - carbon_saved_kg = material_weight_kg × carbon_factor
  - landfill_diverted_kg = material_weight_kg

- **Confidence Levels:**
  - High: Verified weight and material type
  - Medium: Estimated weight or approximate material
  - Low: Broad estimates

#### Environmental Certificates
- **Certificate Generation:**
  - Auto-generated on transaction completion
  - PDF format with embedded graphics
  - QR code for verification
  - Unique reference number

- **Certificate Contents:**
  - Skipped branding and logo
  - Transaction reference
  - Buyer and seller information
  - Material details
  - Carbon saved (kg CO2)
  - Landfill diverted (kg)
  - Trees equivalent comparison
  - Transaction value
  - Calculation methodology
  - Verification QR code
  - Issue date
  - "VERIFIED SKIPPED" seal

- **Certificate Access:**
  - Buyer receives certificate URL
  - Seller receives certificate URL
  - Downloadable PDF
  - Stored in Supabase storage bucket

#### Platform-wide Impact
- Total carbon saved
- Total landfill diverted
- Total transactions
- Impact dashboard

### 6.12 Notifications System

#### Notification Types
- New offer received
- Offer accepted/declined
- Counter offer received
- New message
- Payment received
- Dispatch confirmed
- Delivery confirmed
- Transaction completed
- Review reminder
- Dispute update
- System announcements

#### Notification Channels
- In-app notifications (bell icon)
- Email notifications (configurable per type)
- Unread count badge

#### Notification Preferences
- Enable/disable email notifications globally
- Individual toggles:
  - New messages
  - New offers
  - Transaction updates
  - Review reminders

### 6.13 Dashboard

#### Buyer Dashboard
- Active purchases
- Purchase history
- Messages inbox
- Favourite listings
- Saved searches
- Environmental impact summary

#### Seller Dashboard
- Active listings
- Listing analytics (views, favourites)
- Sales history
- Pending offers
- Messages inbox
- Financial summary
- Stripe Connect status
- Environmental impact contributed

---

## 7. ADMIN FEATURES

### 7.1 Admin Dashboard
- Platform overview statistics
- User metrics
- Transaction metrics
- Revenue tracking
- Recent activity feed

### 7.2 User Management
- View all users
- Search users
- User details view
- Suspend/restore accounts
- Delete accounts
- Verify users
- View user activity
- View user transactions
- Send messages to users

### 7.3 Listing Management
- View all listings
- Search listings
- Edit listings
- Delete listings
- Feature listings
- View listing analytics
- Moderate content

### 7.4 Transaction Management
- View all transactions
- Search transactions
- Transaction details
- Force status updates (emergency)
- View transaction timeline
- Access audit logs

### 7.5 Dispute Resolution
- View all disputes
- Assign disputes to admins
- Review evidence
- Contact parties
- Make resolution decisions
- Process refunds
- Close disputes
- Add admin notes

### 7.6 Financial Management
- Platform balance
- Revenue reports
- Transaction fees collected
- Payout tracking
- Stripe balance check
- Financial analytics
- Export financial data

### 7.7 Blog Management
- Create/edit/delete blog posts
- Rich text editor (TipTap)
- Manage categories
- Upload featured images
- SEO meta fields
- Publish/unpublish posts
- View post analytics
- Manage comments/feedback

### 7.8 Platform Settings
- Configure platform fees
- Manage site banners
- System health monitoring
- Email settings
- Feature toggles
- Maintenance mode

### 7.9 Analytics & Reporting
- User growth
- Transaction volume
- Revenue trends
- Popular categories
- Geographic distribution
- Environmental impact
- Seller performance
- Conversion rates

### 7.10 System Health
- Edge function status
- Database performance
- Storage usage
- Error logs
- API rate limits
- Uptime monitoring

---

## 8. EDGE FUNCTIONS (Serverless API)

### 8.1 Payment Functions

#### create-payment-intent
- **Purpose:** Create Stripe checkout session
- **Input:** listingId, amount, deliveryMethod, buyerLocation, deliveryAddress
- **Process:**
  - Validate inputs
  - Fetch listing details
  - Verify seller Stripe account
  - Check for existing active transactions
  - Calculate platform fee
  - Create/retrieve Stripe customer
  - Create Stripe checkout session
  - Store metadata
- **Output:** sessionId, sessionUrl
- **Security:** Requires authentication

#### verify-payment
- **Purpose:** Verify payment success and create transaction
- **Input:** sessionId
- **Process:**
  - Retrieve Stripe session
  - Verify payment status
  - Extract metadata
  - Create transaction record
  - Update listing availability
  - Send notifications
- **Output:** transaction details
- **Security:** Requires authentication

#### check-connect-status
- **Purpose:** Check seller Stripe onboarding status
- **Input:** None (uses user session)
- **Process:**
  - Fetch user profile
  - Check stripe_account_id
  - Retrieve Stripe account details
  - Check charges_enabled and details_submitted
  - Update profile if complete
- **Output:** onboardingComplete (boolean)
- **Security:** Requires authentication

#### create-connect-account
- **Purpose:** Create Stripe Connect Express account
- **Input:** None (uses user session)
- **Process:**
  - Check for existing account
  - Create Stripe Express account
  - Save account ID to profile
  - Generate onboarding link
- **Output:** url (onboarding link), accountId
- **Security:** Requires authentication

#### get-stripe-balance
- **Purpose:** Fetch platform Stripe balance
- **Input:** None
- **Process:**
  - Initialize Stripe client
  - Retrieve balance
  - Format currency amounts
- **Output:** available balance, pending balance
- **Security:** Requires admin role

### 8.2 Transaction Functions

#### confirm-dispatch
- **Purpose:** Seller confirms dispatch
- **Input:** transactionId
- **Process:**
  - Validate user is seller
  - Update transaction status to 'dispatched'
  - Set dispatch_confirmed_at timestamp
  - Send notification to buyer
- **Output:** success status
- **Security:** Requires authentication, seller verification

#### confirm-delivery
- **Purpose:** Buyer confirms delivery
- **Input:** transactionId
- **Process:**
  - Validate user is buyer
  - Update transaction status to 'delivered'
  - Set delivery_confirmed_at timestamp
  - Trigger seller payout (Stripe transfer)
  - Send notification to seller
  - Generate environmental certificate (if enabled)
- **Output:** success status
- **Security:** Requires authentication, buyer verification

#### raise-dispute
- **Purpose:** Create dispute for transaction
- **Input:** transactionId, disputeType, reason, description, requestedAmount
- **Process:**
  - Validate user is party to transaction
  - Validate dispute type
  - Validate refund amount (if applicable)
  - Create dispute record
  - Update transaction status
  - Send notifications to parties and admins
- **Output:** dispute details
- **Security:** Requires authentication

### 8.3 Admin Functions

#### admin-resolve-dispute
- **Purpose:** Admin resolves dispute with decision
- **Input:** disputeId, resolutionType, approvedAmount, adminNotes
- **Process:**
  - Verify admin role
  - Validate resolution type
  - Process refund if approved (Stripe refund)
  - Update dispute status
  - Update transaction status
  - Send notifications to parties
- **Output:** resolution details
- **Security:** Requires admin role

#### admin-remove-user
- **Purpose:** Suspend or delete user account
- **Input:** userId, action (suspend/delete), reason
- **Process:**
  - Verify admin role
  - Log admin action
  - If suspend:
    - Update profile status
    - Set suspension reason
  - If delete:
    - Delete user data
    - Delete auth user
  - Send notification to user
- **Output:** success status
- **Security:** Requires admin role

### 8.4 Utility Functions

#### get-google-maps-key
- **Purpose:** Securely provide Google Maps API key to frontend
- **Input:** None
- **Process:**
  - Retrieve GOOGLE_MAPS_API_KEY from secrets
  - Return to authenticated users
- **Output:** apiKey
- **Security:** Requires authentication

#### get-seller-financials
- **Purpose:** Fetch seller financial summary
- **Input:** sellerId
- **Process:**
  - Verify user is seller or admin
  - Query transactions
  - Calculate totals
  - Group by status
- **Output:** financial summary
- **Security:** Requires authentication, owner or admin

#### calculate-carbon
- **Purpose:** Calculate carbon impact for listing
- **Input:** materialType, weightKg
- **Process:**
  - Lookup carbon factor for material
  - Calculate carbon_saved_kg
  - Calculate landfill_diverted_kg
  - Determine confidence level
- **Output:** carbon_saved, landfill_diverted, confidence
- **Security:** None (utility)

#### generate-environmental-certificate
- **Purpose:** Generate PDF certificate for transaction
- **Input:** transactionId
- **Process:**
  - Fetch transaction, listing, buyer, seller details
  - Fetch or create certificate record
  - Generate PDF with jsPDF
  - Add Skipped logo, QR code, user logos
  - Calculate trees equivalent
  - Include methodology snapshot
  - Upload PDF to storage
  - Update certificate URLs
  - Return certificate data
- **Output:** certificate details and URLs
- **Security:** Requires authentication, transaction party

#### track-blog-view
- **Purpose:** Track blog post view analytics
- **Input:** postId, sessionId, ipAddress, userAgent
- **Process:**
  - Create blog_post_views record
  - Increment post view_count
- **Output:** success status
- **Security:** None (public)

#### request-account-deletion
- **Purpose:** Initiate account deletion request
- **Input:** reason
- **Process:**
  - Create account_deletion_requests record
  - Set scheduled_deletion_at to 30 days future
  - Send confirmation email
- **Output:** request details
- **Security:** Requires authentication

---

## 9. STORAGE BUCKETS

### 9.1 listing-media
- **Purpose:** Store listing images
- **Public:** Yes
- **Allowed Types:** image/jpeg, image/png, image/webp
- **Max Size:** 5MB per file
- **Compression:** Applied on upload
- **Path Structure:** `{userId}/{listingId}/{filename}`

### 9.2 avatars
- **Purpose:** Store user profile pictures
- **Public:** Yes
- **Allowed Types:** image/jpeg, image/png, image/webp
- **Max Size:** 2MB
- **Path Structure:** `{userId}/avatar.{ext}`

### 9.3 business-logos
- **Purpose:** Store company/business logos
- **Public:** Yes
- **Allowed Types:** image/jpeg, image/png, image/webp, image/svg+xml
- **Max Size:** 2MB
- **Path Structure:** `{userId}/logo.{ext}`

### 9.4 environmental-certificates
- **Purpose:** Store generated PDF certificates
- **Public:** Yes (but URLs are unguessable)
- **Allowed Types:** application/pdf
- **Path Structure:** `{certificateReference}.pdf`

---

## 10. UI/UX FEATURES

### 10.1 Design System
- **Framework:** Tailwind CSS with custom semantic tokens
- **Theme:** Light/dark mode support (next-themes)
- **Colors:** HSL-based with CSS custom properties
- **Primary Colors:**
  - --primary (brand green)
  - --secondary
  - --accent
  - --muted
  - --destructive
- **Typography:** System fonts with fallbacks
- **Spacing:** Consistent spacing scale
- **Components:** Shadcn/ui library

### 10.2 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Touch-friendly interactions
- Adaptive navigation
- Responsive tables and cards

### 10.3 Navigation
- **Main Navigation:**
  - Home
  - Browse
  - How It Works
  - Sell
  - Dashboard (authenticated)
  - Messages (authenticated)
  - Admin (admin only)

- **User Menu:**
  - Profile
  - Settings
  - Dashboard
  - Messages
  - Sign Out

- **Mobile Navigation:**
  - Hamburger menu
  - Slide-out drawer
  - Bottom navigation bar

### 10.4 Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus indicators
- Alt text for images
- Semantic HTML
- Color contrast compliance (WCAG AA)

### 10.5 Performance
- Code splitting
- Lazy loading
- Image optimization
- Infinite scroll/pagination
- Debounced search
- Optimistic updates
- React Query caching

### 10.6 SEO
- React Helmet Async for meta tags
- Dynamic page titles
- Meta descriptions
- Open Graph tags
- Sitemap (public/sitemap.xml)
- Robots.txt (public/robots.txt)
- Structured data (JSON-LD)

### 10.7 PWA Features
- Service worker (public/service-worker.js)
- Offline page (public/offline.html)
- Web manifest (public/manifest.json)
- App icons and splash screens

### 10.8 Loading States
- Skeleton loaders
- Spinner animations
- Progress indicators
- Optimistic UI updates

### 10.9 Error Handling
- Error boundary
- Toast notifications (Sonner)
- Form validation errors
- API error messages
- Retry mechanisms
- Fallback UI

### 10.10 Components Library

#### Custom Components
- ListingCard: Display listing preview
- CategoryCard: Category navigation
- MessageDialog: Messaging interface
- OfferDialog: Make offer modal
- CounterOfferDialog: Counter offer modal
- DisputeDialog: Raise dispute modal
- ReviewDialog: Leave review modal
- TransactionTimeline: Visual transaction progress
- TransactionManager: Transaction actions
- StarRating: Rating display/input
- MediaUpload: Multi-file upload with preview
- LocationAutocomplete: Google Maps location search
- MapSearch: Map view with markers
- ImageModal: Lightbox for images
- EmptyState: No results placeholder
- LoadingSkeletons: Content placeholders
- BackToTop: Scroll to top button
- CarbonBadge: Environmental impact badge
- VerificationBadge: Verified user badge
- HolidayBanner: Holiday mode indicator

#### Shadcn Components
- Button, Input, Textarea, Select
- Dialog, Sheet, Drawer
- Card, Badge, Avatar
- Tabs, Accordion, Collapsible
- DropdownMenu, ContextMenu
- Toast, Alert, AlertDialog
- Table, Pagination
- Calendar, DatePicker
- Progress, Skeleton
- Tooltip, HoverCard
- Switch, Checkbox, RadioGroup
- Slider, Separator
- ScrollArea, ResizablePanel
- Command, Combobox

---

## 11. PAGES & ROUTES

### 11.1 Public Pages
- `/` - Home/Landing page
- `/browse` - Marketplace listings
- `/listing/:id` - Listing details
- `/how-it-works` - Platform guide
- `/sell` - Create listing (requires auth)
- `/faq` - Frequently asked questions
- `/privacy-policy` - Privacy policy
- `/terms-of-service` - Terms of service
- `/cookie-policy` - Cookie policy
- `/buyer-protection` - Buyer protection info
- `/safety-guidelines` - Safety guidelines
- `/delivery-options` - Delivery information
- `/dispute-resolution` - Dispute process
- `/carbon-calculator` - Environmental impact calculator
- `/contact-us` - Contact form
- `/news` - Blog listing
- `/news/:slug` - Blog post detail

### 11.2 Authentication Pages
- `/sign-in` - Login
- `/sign-up` - Registration
- `/reset-password` - Password reset
- `/auth/callback` - OAuth callback

### 11.3 Protected Pages (Require Authentication)
- `/dashboard` - User dashboard (tabs: Listings, Purchases, Favourites, Messages)
- `/create-listing` - Create new listing
- `/settings` - User settings
- `/messages` - Messages inbox

### 11.4 Admin Pages (Require Admin Role)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/listings` - Listing management
- `/admin/transactions` - Transaction management
- `/admin/disputes` - Dispute resolution
- `/admin/financials` - Financial reports
- `/admin/analytics` - Platform analytics
- `/admin/blog` - Blog management
- `/admin/settings` - Platform settings
- `/admin/system-health` - System monitoring

### 11.5 Error Pages
- `/404` - Not found

---

## 12. THIRD-PARTY SERVICES

### 12.1 Stripe
- **Purpose:** Payment processing and seller payouts
- **Account Type:** Platform (Connect)
- **Features Used:**
  - Stripe Connect (Express accounts)
  - Payment Intents
  - Checkout Sessions
  - Webhooks (payment_intent.succeeded)
  - Transfers (seller payouts)
  - Refunds
  - Balance inquiries

### 12.2 Google Maps
- **Purpose:** Location services
- **APIs Used:**
  - JavaScript API (map display)
  - Places API (autocomplete)
  - Geocoding API (address to coordinates)
  - Distance Matrix API (distance calculations)
- **Map ID:** Custom styled map

### 12.3 Supabase
- **Purpose:** Backend infrastructure
- **Services:**
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions (Deno)
  - Realtime subscriptions

---

## 13. SECURITY MEASURES

### 13.1 Authentication Security
- Secure password hashing (Supabase Auth)
- Email verification required
- Password strength requirements
- Session management
- Token refresh

### 13.2 Authorization Security
- Row Level Security (RLS) on all tables
- Role-based access control (RBAC)
- Owner-only data access patterns
- Admin permission checks

### 13.3 Data Security
- Private fields hidden in views (public_listings, public_safe_profiles)
- Sensitive data encrypted at rest
- HTTPS only
- Secure cookies
- Environment variables for secrets

### 13.4 Payment Security
- PCI-compliant (Stripe handles card data)
- Stripe-hosted checkout
- No card data stored locally
- Webhook signature verification
- Payment intent verification

### 13.5 Input Validation
- Zod schema validation
- Server-side validation
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- CSRF protection

### 13.6 Rate Limiting
- Rate limit log table
- IP-based rate limiting
- User-based rate limiting
- Action type tracking

### 13.7 Content Security
- File type validation
- File size limits
- Image compression
- Content moderation (admin)

---

## 14. ENVIRONMENTAL FEATURES

### 14.1 Carbon Calculation
- Material-specific carbon factors
- Weight-based calculation
- Confidence levels
- Methodology transparency

### 14.2 Certificate Generation
- PDF format
- QR code verification
- Unique reference numbers
- Buyer and seller copies
- Blockchain-ready structure

### 14.3 Impact Dashboard
- Platform-wide statistics
- User-specific impact
- Seller contribution tracking
- Visualizations (charts)

### 14.4 Gamification (Potential)
- Carbon savings leaderboard
- Badges for milestones
- Seller verification badges
- Environmental champion status

---

## 15. BUSINESS LOGIC

### 15.1 Pricing Rules
- Minimum price: £0 (free items allowed)
- Maximum price: £100,000
- Delivery cost separate from item price
- Platform fee: Configurable percentage (default 5%)
- Buyer protection fee: Optional

### 15.2 Transaction Rules
- Payment held by platform until delivery confirmed
- Seller payout on delivery confirmation
- Dispute period: 30 days from completion
- Review window: Unlimited after completion
- Refund maximum: Transaction amount

### 15.3 Offer Rules
- Offer must be less than listing price
- Counter offers allowed
- Expired offers cannot be accepted
- Withdrawn offers cannot be revived
- One active offer per buyer per listing

### 15.4 Listing Rules
- Must have at least one image
- Must have category
- Must have location
- Sold listings marked unavailable
- Listings auto-deactivate when purchased

### 15.5 Review Rules
- One review per transaction per party
- Can only review after completion
- Can edit own reviews
- Sellers can reply once
- Reviews cannot be deleted by others

### 15.6 Dispute Rules
- Can only dispute own transactions
- Must provide reason and description
- Evidence upload optional
- Admin makes final decision
- Dispute closes transaction modifications

---

## 16. ANALYTICS & TRACKING

### 16.1 User Analytics
- Registration date
- Last active timestamp
- Listing count
- Transaction count
- Review count
- Average rating

### 16.2 Listing Analytics
- View count
- Favourite count
- Offer count
- Days active
- Conversion rate

### 16.3 Transaction Analytics
- Total volume
- Average transaction value
- Completion rate
- Dispute rate
- Time to completion

### 16.4 Platform Analytics
- Total users
- Active users (30 days)
- Total listings
- Active listings
- Total transactions
- Revenue
- Carbon saved
- Geographic distribution

### 16.5 Blog Analytics
- View count per post
- Reading time
- Engagement (helpful/not helpful)
- Popular posts
- Category performance

---

## 17. EMAIL NOTIFICATIONS

### 17.1 Transactional Emails
- Welcome email (registration)
- Email verification
- Password reset
- New offer received
- Offer accepted/declined
- Payment received
- Dispatch confirmation
- Delivery confirmation
- Review reminder
- Dispute updates
- Admin messages

### 17.2 Email Preferences
- Global enable/disable
- Individual notification type toggles
- Frequency settings (immediate/daily digest)

---

## 18. MAINTENANCE & MONITORING

### 18.1 Database Maintenance
- Automated backups
- Index optimization
- Vacuum/analyze scheduling
- Query performance monitoring

### 18.2 Error Tracking
- Frontend error boundary
- Edge function error logs
- Database error logs
- Failed payment tracking

### 18.3 Performance Monitoring
- Page load times
- API response times
- Database query performance
- Storage usage

### 18.4 Health Checks
- Database connectivity
- Edge function status
- Storage availability
- Third-party API status (Stripe, Google Maps)

---

## 19. DEPLOYMENT

### 19.1 Frontend Deployment
- **Platform:** Lovable.dev
- **Build:** Vite production build
- **Hosting:** Lovable CDN
- **Domain:** Custom domain support
- **SSL:** Automatic HTTPS

### 19.2 Backend Deployment
- **Database:** Supabase managed PostgreSQL
- **Edge Functions:** Auto-deploy on push
- **Storage:** Supabase managed storage
- **Secrets:** Environment variables in Supabase dashboard

### 19.3 CI/CD
- Automatic deployments from Lovable
- Edge function deployment on save
- Database migrations manual approval

---

## 20. FUTURE ENHANCEMENTS (Potential)

### 20.1 Features
- Multi-language support
- Mobile app (React Native)
- Advanced search filters
- Bulk listing upload
- Auction functionality
- Subscription plans for sellers
- Verified seller badges
- Insurance options
- Delivery tracking integration
- Video uploads
- 3D model support
- AR preview
- Social sharing
- Referral program

### 20.2 Integrations
- Additional payment methods (PayPal, Apple Pay, Google Pay)
- Shipping carriers (Royal Mail, DPD, etc.)
- Accounting software (Xero, QuickBooks)
- CRM systems
- Marketing automation
- Social media platforms

### 20.3 Analytics
- AI-powered pricing suggestions
- Demand forecasting
- Fraud detection
- Sentiment analysis on reviews
- Predictive analytics

---

## 21. DEVELOPMENT SETUP

### 21.1 Prerequisites
- Node.js 18+
- npm or bun
- Git
- Supabase CLI (optional for local dev)

### 21.2 Environment Variables
```env
SUPABASE_URL=https://whfjfwxjtujfntwukzih.supabase.co
SUPABASE_ANON_KEY=[anon key]
```

### 21.3 Installation
```bash
git clone [repository]
npm install
npm run dev
```

### 21.4 Database Setup
1. Create Supabase project
2. Run migrations in order
3. Configure RLS policies
4. Create storage buckets
5. Set up edge functions
6. Configure secrets

### 21.5 Stripe Setup
1. Create Stripe account
2. Enable Connect
3. Configure webhooks
4. Add secret key to Supabase secrets

### 21.6 Google Maps Setup
1. Create Google Cloud project
2. Enable Maps JavaScript API and Places API
3. Create API key with restrictions
4. Add to Supabase secrets

---

## 22. TESTING STRATEGY

### 22.1 Unit Tests
- Utility functions
- Form validation schemas
- Calculation logic

### 22.2 Integration Tests
- Payment flow
- Transaction lifecycle
- Dispute process
- Certificate generation

### 22.3 E2E Tests
- User registration and login
- Create and edit listing
- Make purchase
- Message exchange
- Leave review

### 22.4 Manual Testing Checklist
- Cross-browser testing
- Mobile responsive testing
- Payment testing (test mode)
- Email delivery testing
- Edge function testing
- Performance testing

---

## 23. DOCUMENTATION REQUIREMENTS

### 23.1 User Documentation
- Getting started guide
- How to sell guide
- How to buy guide
- Payment guide
- Dispute resolution guide
- Environmental certificate guide
- FAQ

### 23.2 Developer Documentation
- API documentation
- Database schema documentation
- Edge function documentation
- Component documentation
- Deployment guide
- Troubleshooting guide

### 23.3 Admin Documentation
- Admin panel guide
- User management guide
- Dispute resolution guide
- Financial management guide
- System monitoring guide

---

## 24. COMPLIANCE & LEGAL

### 24.1 GDPR Compliance
- Privacy policy
- Cookie consent
- Data access requests
- Data deletion requests (30-day grace)
- Data export
- Consent management

### 24.2 Terms of Service
- User agreement
- Prohibited items
- Dispute resolution policy
- Refund policy
- Intellectual property
- Liability limitations

### 24.3 Payment Compliance
- PCI DSS (via Stripe)
- Anti-money laundering (AML)
- Know Your Customer (KYC) for sellers
- Tax reporting (1099 forms for US sellers)

---

## 25. SUPPORT & MAINTENANCE

### 25.1 Customer Support
- Contact form
- Email support
- FAQ/Help center
- In-app messaging
- Admin direct messaging

### 25.2 Issue Resolution
- Bug tracking
- Feature requests
- User feedback
- Performance issues
- Security vulnerabilities

### 25.3 Regular Updates
- Security patches
- Feature releases
- Bug fixes
- Performance optimizations
- Dependency updates

---

## APPENDIX A: DATABASE ERD

```
auth.users (Supabase managed)
    ↓
profiles (user_id)
    ↓
listings (seller_id)
    ↓
transactions (listing_id, buyer_id, seller_id)
    ↓
├─ reviews (transaction_id, reviewer_id, seller_id)
├─ disputes (transaction_id, raised_by_id, against_id)
│   └─ dispute_evidence (dispute_id, uploaded_by_id)
└─ environmental_certificates (transaction_id, buyer_id, seller_id)

offers (listing_id, buyer_id, seller_id)
    └─ messages (offer_id, sender_id, receiver_id)

favourites (user_id, listing_id)

notifications (user_id)

user_roles (user_id)

saved_searches (user_id)

categories (referenced by listings)

blog_posts (author_id)
    ├─ blog_post_categories (post_id, category_id)
    ├─ blog_post_views (post_id, user_id)
    └─ blog_post_feedback (post_id, user_id)

blog_categories

site_banners

admin_actions (admin_id, target_user_id)

transaction_audit_log (transaction_id, user_id)

account_deletion_requests (user_id)

rate_limit_log (user_id)

platform_settings
```

---

## APPENDIX B: API ENDPOINTS

### Edge Functions Base URL
`https://whfjfwxjtujfntwukzih.supabase.co/functions/v1`

### Endpoints
- POST `/create-payment-intent`
- POST `/verify-payment`
- POST `/create-connect-account`
- GET `/check-connect-status`
- GET `/get-stripe-balance`
- POST `/confirm-dispatch`
- POST `/confirm-delivery`
- POST `/raise-dispute`
- POST `/admin-resolve-dispute`
- POST `/admin-remove-user`
- GET `/get-google-maps-key`
- GET `/get-seller-financials`
- POST `/calculate-carbon`
- POST `/generate-environmental-certificate`
- POST `/track-blog-view`
- POST `/request-account-deletion`

---

## APPENDIX C: SECRETS CONFIGURATION

Required secrets in Supabase dashboard:
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_...)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `GOOGLE_MAP_ID` - Custom styled map ID
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for edge functions)
- `SUPABASE_DB_URL` - Database connection string (for migrations)

---

## DOCUMENT VERSION

**Version:** 1.0  
**Last Updated:** 2025  
**Status:** Production Ready  
**Maintainer:** Skipped Development Team

---

## NOTES

This document represents the complete state of the Skipped marketplace application as built. It should be used as the definitive reference for:

1. **Rebuilding:** If data loss occurs, this document contains all necessary information to reconstruct the application
2. **Onboarding:** New developers can understand the complete system architecture
3. **Feature Planning:** Future enhancements can be planned with full context
4. **Troubleshooting:** Issues can be diagnosed with complete system knowledge
5. **Documentation:** Serves as comprehensive documentation for all stakeholders

**IMPORTANT:** Keep this document updated with any significant changes to features, schema, or business logic.
