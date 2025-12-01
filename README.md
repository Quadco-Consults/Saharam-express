# Saharan Express Ticketing System

> ...driving excellence one mile at a time

A modern, full-stack ticketing system for Saharan Express Limited, Nigeria's premium inter-city transport service connecting Kano and Kaduna.

## 🚌 About Saharan Express

Saharan Express Limited is a premium car logistics company operating between Kano and Kaduna states in Nigeria. We provide safe, reliable, and comfortable transportation services with a focus on punctuality and customer satisfaction.

## 🌟 Features

### Customer Features
- **Online Booking**: Easy-to-use booking interface
- **Route Selection**: Kano ↔ Kaduna daily services
- **Seat Selection**: Interactive seat map
- **Multiple Payment Options**: Paystack, OPay, and other Nigerian gateways
- **Digital Tickets**: QR code-based tickets
- **Real-time Updates**: Trip status and notifications
- **Mobile Responsive**: Works perfectly on all devices

### Admin Features
- **Trip Management**: Schedule and manage trips
- **Vehicle Management**: Track fleet and maintenance
- **Booking Overview**: Monitor all reservations
- **Payment Tracking**: Financial reporting and analytics
- **Customer Management**: User account oversight
- **Dashboard Analytics**: Key performance metrics

### Technical Features
- **Secure Authentication**: Supabase Auth integration
- **Payment Processing**: Multiple Nigerian payment gateways
- **Real-time Database**: PostgreSQL with Supabase
- **SMS/Email Notifications**: Automated customer communications
- **QR Code Generation**: Ticket validation system
- **Responsive Design**: Mobile-first approach

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless functions
- **Supabase** - PostgreSQL database and authentication
- **Row Level Security (RLS)** - Data security

### Payments
- **Paystack** - Primary payment gateway
- **OPay** - Alternative payment option
- **Webhook Integration** - Payment verification

### Services
- **SMS Integration** - Notifications via Termii/similar
- **Email Service** - SMTP integration
- **QR Code Generation** - Digital ticket validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and yarn
- Supabase account
- Payment gateway accounts (Paystack, OPay)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Quadco-Consults/Saharam-express.git
   cd Saharam-express
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL from `database-schema.sql` in your Supabase SQL editor
   - Add your Supabase URL and keys to `.env.local`

5. **Configure payment gateways**
   - Set up Paystack account and add keys
   - Set up OPay account and add credentials
   - Update webhook URLs in your payment dashboards

6. **Run the development server**
   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   └── booking/           # Booking flow
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── payments/          # Payment integrations
│   └── supabase.ts        # Database client
├── types/                 # TypeScript definitions
├── utils/                 # Helper functions
└── hooks/                 # Custom React hooks
```

## 🗄️ Database Schema

The system uses PostgreSQL with the following main tables:
- `users` - Customer and admin accounts
- `routes` - Available travel routes
- `vehicles` - Fleet management
- `trips` - Scheduled journeys
- `bookings` - Customer reservations
- `payments` - Transaction records
- `notifications` - Communication logs

## 🔒 Security Features

- **Row Level Security (RLS)** on all sensitive tables
- **JWT authentication** via Supabase
- **HTTPS enforcement** in production
- **Input validation** with Zod schemas
- **SQL injection prevention** via Supabase client
- **Rate limiting** on API endpoints

## 📱 Payment Integration

### Supported Gateways
- **Paystack** - Cards, bank transfers, USSD
- **OPay** - Mobile money, bank transfers
- **Extensible** - Easy to add more gateways

### Payment Flow
1. Customer selects payment method
2. Payment initialized via gateway API
3. Customer completes payment
4. Webhook confirms transaction
5. Booking status updated
6. Digital ticket generated

## 🚀 Deployment

### Recommended Platforms
- **Vercel** - Frontend deployment
- **Supabase** - Database and auth
- **Railway** - Full-stack deployment option

### Environment Variables
See `.env.local.example` for required environment variables.

## 📞 Support

For technical support or business inquiries:
- **Email**: info@saharamexpress.com.ng
- **Phone**: +234 701 234 5678
- **GitHub Issues**: [Report bugs here](https://github.com/Quadco-Consults/Saharam-express/issues)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

## 📄 License

This project is proprietary software owned by Saharan Express Limited.

---

**Saharan Express Limited** - Driving excellence one mile at a time 🚌