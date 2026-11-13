# Distribo Delivery — FMCG Delivery Pilot Mobile Application

Dedicated production-ready mobile application for delivery personnel who collect approved FMCG orders from the central warehouse and deliver products to retail stores.

Integrated seamlessly with:
1. **Admin Web Portal** (`Distribo-CRM`)
2. **Sales Person Mobile App** (`Distribo-Sales`)
3. **Delivery Person Mobile App** (`Distribo-Delivery`)

---

## 🚀 Key Features

### 1. Dedicated Fleet Authentication & Role Security
- Exclusive pilot sign-in by **Email** or **Employee ID** (e.g. `EMP-D001` or `suresh@aarvifmcg.com`).
- Role verification ensures Sales Reps and Web Admins cannot access the delivery portal.
- Suspended / inactive account protection.
- Session caching with `AsyncStorage` for instant offline startup.
- Password recovery via registered fleet email.

### 2. Delivery Dashboard (Home)
- Shift metrics: Total Assigned, Pending Pickup at Godown, In Transit, Fully Delivered, Partial Drops.
- Today's Delivery Beat with order cards, store destination, amount, and items.
- Live notifications bell with unread badge counter.
- Pull-to-refresh & auto-refresh query polling.

### 3. My Deliveries (Fulfillment Management)
- Filter tabs: All, Pending Pickup, In Transit, Partial Drops, Delivered.
- Instant search by Order Number or Retail Store Name.
- Direct quick-actions: Call Store, Directions in Maps, View Details.

### 4. Warehouse Pickup Workflow
- Origin Godown details (Central FMCG Godown, WH-MAIN-01, Address, Manager Phone).
- Pre-departure SKU inspection list.
- One-touch "Confirm Warehouse Pickup" updates assignment to `in_transit`, sets order to `out_for_delivery`, and logs dispatch stock movements in Supabase.

### 5. Start Delivery & Turn-by-Turn Transit
- Direct store contact via one-tap dialer.
- Navigation integration with Apple Maps (iOS) and Google Maps (Android).
- Device GPS location logging to `location_history`.

### 6. Delivery Execution (Full & Partial Drops)
- Product-by-product quantity stepper.
- "Mark All Full" quick-fill button.
- Partial delivery recording: automatically computes remaining units and validates that quantities do not exceed ordered amounts.
- Required note/reason for partial deliveries (e.g. damaged stock, store shortage).
- Updates `order_items.delivered_quantity`, sets status to `partially_delivered` or `delivered`.

### 7. Delivery Success & History
- Detailed drop receipt screen with breakdown of delivered units vs ordered units.
- Complete historical consignments view with date and status filters.

### 8. Notifications & Alerts
- Real-time alerts on new order assignments, warehouse clearances, and status transitions from the shared Supabase `notifications` table.

### 9. Profile & Help Center
- Fleet pilot credentials, vehicle type, and number plate.
- Device GPS location permission diagnostics.
- Offline sync engine diagnostics.
- Comprehensive FMCG Help & Support FAQ answering all pilot operational questions.

### 10. Offline Resiliency
- Offline cache for assigned deliveries and order details.
- Queue manager captures pickups and drop confirmations when offline, synchronizing automatically upon network restoration.

---

## 📱 Tech Stack

- **Framework**: React Native with Expo SDK 58 (Expo Router 58)
- **Language**: TypeScript (Strict Mode)
- **Database & Auth**: Supabase PostgreSQL & Supabase Auth
- **Data Fetching**: TanStack React Query v5
- **Icons**: Lucide React Native
- **Storage**: `@react-native-async-storage/async-storage`
- **Location**: `expo-location`

---

## 🎨 Branding & Colors

- **Primary (Lime Green)**: `#A8D83D`
- **Dark Green (Brand Accent & Text)**: `#294D32`
- **Light Green (Pill Tint)**: `#F1F8E8`
- **Background (Canvas)**: `#F7F8F5`
- **Card (Surfaces)**: `#FFFFFF`
- **Primary Text**: `#202820`
- **Secondary Text**: `#858B83`
- **Border**: `#E9EDE5`

---

## 🔑 Authorized Pilot Credentials (Pre-Configured)

| Pilot Name | Employee ID | Email | Password | Vehicle | Plate |
|---|---|---|---|---|---|
| **Suresh Yadav** | `EMP-D001` | `suresh@aarvifmcg.com` | `Suresh@1234` | Mini Truck (Tata Ace) | `GJ-03-AB-1234` |
| **Ramesh Gupta** | `EMP-D002` | `ramesh@aarvifmcg.com` | `Ramesh@1234` | Cargo Auto | `DL-02-CD-5678` |

---

## 🏃 Running the Application

```bash
# Start Expo development server
npx expo start

# Run on Android Emulator or connected device
npx expo start --android

# Run on iOS Simulator (macOS)
npx expo start --ios

# Run in Web Browser
npx expo start --web
```

