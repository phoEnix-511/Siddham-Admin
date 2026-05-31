# Siddham Wellness – E-Commerce Platform
## 🌿 Complete Ayurvedic ecommerce store with Admin Dashboard

A production-ready, full-stack web application built with:
- **Frontend + Backend**: Next.js 16 (Pages Router) + TypeScript  
- **Database**: PostgreSQL via Prisma ORM  
- **Payments**: Razorpay integration  
- **Auth**: JWT-based admin authentication  
- **Deployment**: Docker + Docker Compose  

---

## 🚀 Quick Start (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Clone and Configure

```bash
# Copy environment file and edit your credentials
cp .env.example .env
```

Edit `.env` with your values:
| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Any random string (used for admin auth) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Your Razorpay Key ID (from dashboard) |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Secret Key |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |

### 2. Start Everything

```bash
docker compose up -d
```

This starts:
1. **PostgreSQL** database on port `5432`
2. **Next.js** application on port `3000`

### 3. Seed the Database

After containers are running, seed the database with products and admin user:

```
Visit: http://localhost:3000/api/admin/seed
```

Or via CLI (if running locally without Docker):
```bash
npm run db:seed
```

### 4. Access the App

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | 🛍️ Customer Storefront |
| `http://localhost:3000/admin/login` | 🔐 Admin Dashboard |

**Default Admin Credentials:**
- Email: `admin@siddhamwellness.com`
- Password: `Admin@123`

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── index.tsx          # Home page
│   ├── shop.tsx           # Product listing
│   ├── checkout.tsx       # Checkout with Razorpay
│   ├── about.tsx          # Brand story
│   ├── products/[id].tsx  # Product detail
│   ├── admin/
│   │   ├── login.tsx      # Admin login
│   │   ├── index.tsx      # Dashboard
│   │   ├── products/      # Product management
│   │   ├── orders/        # Order management
│   │   ├── reports.tsx    # Sales & stock reports
│   │   └── settings.tsx   # Store configuration
│   └── api/               # Backend API routes
├── components/            # Reusable UI components
├── context/               # React context (Cart, Toast)
├── lib/                   # Utilities (auth, prisma, utils)
└── styles/                # Global CSS design system
```

---

## ⚙️ Admin Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Revenue, orders, customers, low-stock alerts |
| **Products** | Add, edit, delete, toggle active/featured status |
| **Orders** | View all orders, update status (Pending → Delivered) |
| **Reports** | Sales by date range (CSV download), stock report (CSV) |
| **Settings** | Razorpay keys, store info, shipping config |

---

## 💳 Razorpay Setup

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys → Generate Test Key
3. Copy Key ID and Secret to your `.env` file
4. Test with Razorpay test card: `4111 1111 1111 1111`

You can also update Razorpay keys live via:  
**Admin Dashboard → Settings → Razorpay Configuration**

---

## 🗄️ Database Management

```bash
# Stop containers and remove volumes (WARNING: deletes all data)
docker compose down -v

# View database logs
docker compose logs db

# Connect to database directly
docker exec -it siddham_db psql -U siddham_user -d siddham_db
```

---

## 🛠️ Local Development (without Docker)

```bash
# Install dependencies
npm install

# Set up local PostgreSQL and update DATABASE_URL in .env

# Generate Prisma client
npm run db:generate

# Run migrations (requires running database)
npx prisma migrate deploy

# Seed database
npm run db:seed

# Start development server
npm run dev
```

---

## 🌿 Brand Design

The design follows the **Siddham Wellness brand identity**:
- **Primary Color**: Deep Forest Green (`#1a3d2b`)
- **Accent**: Saffron Gold (`#c4852a`)
- **Background**: Warm Parchment (`#f8f4ee`)
- **Typography**: Playfair Display (headings) + Inter (body)
