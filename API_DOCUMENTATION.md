# Saharan Express Limited - API Documentation

## Overview

This documentation covers all the implemented APIs for Saharan Express Limited's bus ticketing system, including comprehensive payment integration with Paystack and OPay.

## Base URL
- Development: `http://localhost:3001`
- Production: `https://your-domain.com`

## Authentication

Most customer APIs work without authentication. Admin APIs require JWT authentication:

```
Authorization: Bearer <your_jwt_token>
```

Get token by logging in as admin:
- Email: `admin@saharan-express.com`
- Password: `admin123`

## Payment Providers

### Paystack
- **Documentation**: https://paystack.com/docs/
- **Test Cards**: https://paystack.com/docs/payments/test-payments/
- **Webhook URL**: `/api/payments/webhook/paystack`

### OPay
- **Documentation**: https://doc.opaycheckout.com/
- **Webhook URL**: `/api/payments/webhook/opay`

## API Endpoints

### 1. Trip Search
Search for available trips between cities.

**GET** `/api/trips/search`

**Query Parameters:**
```
fromCity: string (required)
toCity: string (required)
departureDate: string (required, YYYY-MM-DD format)
passengers: number (optional, default: 1, max: 10)
sortBy: string (optional, options: 'price'|'duration'|'departure')
```

**Example Request:**
```bash
GET /api/trips/search?fromCity=Lagos&toCity=Abuja&departureDate=2025-12-02&passengers=2&sortBy=price
```

**Response:**
```json
{
  "success": true,
  "data": {
    "searchCriteria": {
      "fromCity": "Lagos",
      "toCity": "Abuja",
      "departureDate": "2025-12-02",
      "passengers": 2,
      "sortBy": "price"
    },
    "results": {
      "total": 3,
      "trips": [
        {
          "id": "trip_id_123",
          "route": {
            "id": "route_id_456",
            "fromCity": "Lagos",
            "toCity": "Abuja",
            "distance": 750
          },
          "schedule": {
            "departureTime": "2025-12-02T08:00:00Z",
            "arrivalTime": "2025-12-02T16:00:00Z",
            "estimatedDuration": 480
          },
          "vehicle": {
            "model": "Toyota Hiace",
            "plateNumber": "LAG-123-ABC",
            "capacity": 18,
            "year": 2022
          },
          "driver": {
            "name": "John Adebayo",
            "rating": 4.5
          },
          "pricing": {
            "basePrice": 4500,
            "pricePerSeat": 4500,
            "totalPrice": 9000,
            "currency": "NGN"
          },
          "seats": {
            "total": 18,
            "available": 12,
            "booked": 6,
            "canAccommodatePassengers": true,
            "availableSeatNumbers": ["A1", "A2", "B1", "B2"]
          },
          "amenities": ["Air Conditioning", "Comfortable Seating", "Professional Driver"],
          "bookingUrl": "/booking/create?tripId=trip_id_123"
        }
      ]
    }
  }
}
```

### 2. Trip Details
Get detailed information about a specific trip.

**GET** `/api/trips/{tripId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "trip_id_123",
    "status": "scheduled",
    "route": {
      "fromCity": "Lagos",
      "toCity": "Abuja",
      "distance": 750,
      "estimatedDuration": 480
    },
    "seats": {
      "seatMap": [
        {
          "number": "A1",
          "status": "available",
          "position": { "row": 1, "seat": 1 }
        },
        {
          "number": "A2",
          "status": "booked",
          "position": { "row": 1, "seat": 2 }
        }
      ]
    },
    "isBookable": true
  }
}
```

### 3. Create Booking
Create a new booking for a trip.

**POST** `/api/bookings/create`

**Request Body:**
```json
{
  "tripId": "trip_id_123",
  "passengerName": "Jane Doe",
  "passengerPhone": "+2348012345678",
  "passengerEmail": "jane@example.com",
  "seatNumbers": ["A1", "A2"],
  "loyaltyPointsToUse": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_id_789",
      "reference": "SAH123456ABCD",
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "totalAmount": "9000",
      "seatNumbers": ["A1", "A2"]
    },
    "trip": {
      "route": "Lagos to Abuja",
      "departureTime": "2025-12-02T08:00:00Z"
    },
    "pricing": {
      "baseAmount": 9000,
      "discountAmount": 0,
      "totalAmount": 9000
    },
    "requiresPayment": true
  }
}
```

### 4. Initialize Payment
Initialize payment for a booking.

**POST** `/api/payments/initialize`

**Request Body:**
```json
{
  "bookingId": "booking_id_789",
  "provider": "paystack",
  "returnUrl": "https://yourapp.com/payment/success"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference": "SAH_PST_1733062500_ABC123",
    "authorizationUrl": "https://checkout.paystack.com/kixd9nonoitt8kq",
    "provider": "paystack",
    "amount": "9000",
    "booking": {
      "id": "booking_id_789",
      "reference": "SAH123456ABCD",
      "route": "Lagos to Abuja",
      "passengerName": "Jane Doe"
    }
  }
}
```

### 5. Verify Payment
Verify a payment transaction.

**POST** `/api/payments/verify`

**Request Body:**
```json
{
  "reference": "SAH_PST_1733062500_ABC123",
  "provider": "paystack"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference": "SAH_PST_1733062500_ABC123",
    "provider": "paystack",
    "status": "success",
    "amount": 9000,
    "paidAt": "2025-12-01T16:30:00Z",
    "booking": {
      "id": "booking_id_789",
      "status": "CONFIRMED",
      "paymentStatus": "COMPLETED",
      "loyaltyPointsEarned": 90
    }
  }
}
```

### 6. Payment Webhooks

#### Paystack Webhook
**POST** `/api/payments/webhook/paystack`

Automatically handles:
- `charge.success` - Confirms successful payments
- `charge.failed` - Handles failed payments

#### OPay Webhook
**POST** `/api/payments/webhook/opay`

Automatically handles:
- `SUCCESS` - Confirms successful payments
- `FAIL`/`CLOSE` - Handles failed payments

## Environment Variables

Add these to your `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saharan_express

# Authentication
JWT_SECRET=your_jwt_secret_here

# Paystack
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here

# OPay
OPAY_PUBLIC_KEY=your_opay_public_key_here
OPAY_SECRET_KEY=your_opay_secret_key_here
OPAY_MERCHANT_ID=your_opay_merchant_id_here

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

## Testing Payment Flow

### 1. Search for Trips
```bash
curl "http://localhost:3001/api/trips/search?fromCity=Lagos&toCity=Abuja&departureDate=2025-12-02&passengers=1"
```

### 2. Create Booking
```bash
curl -X POST http://localhost:3001/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "your_trip_id",
    "passengerName": "Test User",
    "passengerPhone": "+2348012345678",
    "passengerEmail": "test@example.com",
    "seatNumbers": ["A1"]
  }'
```

### 3. Initialize Payment
```bash
curl -X POST http://localhost:3001/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "your_booking_id",
    "provider": "paystack"
  }'
```

### 4. Test Cards for Paystack

**Successful Payment:**
- Card: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`

**Failed Payment:**
- Card: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `1111` (wrong PIN)

## Error Handling

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional validation details
}
```

## Status Codes
- `200` - Success
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Payment Flow Summary

1. **Search Trips** → Find available trips
2. **Create Booking** → Reserve seats temporarily
3. **Initialize Payment** → Get payment URL from provider
4. **Customer Pays** → Redirect to Paystack/OPay
5. **Webhook Confirmation** → Automatic payment verification
6. **Booking Confirmed** → Seats permanently reserved
7. **Loyalty Points** → Automatically awarded

## Features Implemented

✅ **Trip Search & Filtering**
✅ **Seat Selection & Management**
✅ **Booking Creation with Validation**
✅ **Dual Payment Provider Support (Paystack + OPay)**
✅ **Automatic Payment Verification**
✅ **Webhook Security (Signature Validation)**
✅ **Loyalty Points System**
✅ **Comprehensive Error Handling**
✅ **Admin Dashboard APIs**
✅ **Database Transactions for Data Integrity**

The payment system is production-ready and supports both major Nigerian payment providers with proper webhook handling, security, and error management.