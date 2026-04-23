# SmartKhata

A digital ledger (khata) application designed for small and medium-sized businesses to manage customer credit, track transactions, and improve payment collection efficiency.

## Tech Stack

- **Frontend**: React with TailwindCSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Mobile**: Hybrid Android app (WebView + native capabilities)

## Project Structure

```
smartkhata/
├── backend/          # Node.js/Express backend
├── frontend/         # React web application
├── android/          # Android hybrid app
└── README.md
```

## Features

- User authentication (mobile number login)
- Customer management (add, edit, delete, search)
- Ledger management (credit/debit entries)
- Transaction history with filtering
- Dashboard with metrics
- Reminder system (WhatsApp integration)
- Contact synchronization (Android only)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn
- Android Studio (for Android app)
- Java 8+ (for Android app)

## Quick Start

### 1. Start MongoDB

Make sure MongoDB is running on your system:
```bash
# For MongoDB installed locally
mongod

# Or use MongoDB Atlas (update .env with connection string)
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL if needed
npm start
```

The frontend will run on `http://localhost:3000`

### 4. Android App Setup

See `android/README.md` for detailed Android setup instructions.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login or register with phone number
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/search?query=xyz` - Search customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Add new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Transactions
- `GET /api/transactions/customer/:customerId` - Get customer transactions
- `POST /api/transactions` - Add transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Contacts (Android only)
- `POST /api/contacts/sync` - Sync contacts from device
- `GET /api/contacts` - Get synced contacts
- `DELETE /api/contacts` - Delete all contacts

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartkhata
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Twilio Configuration for OTP SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Usage

1. Open `http://localhost:3000` in your browser
2. Enter your phone number and name (if new user)
3. Add customers
4. Record credit/debit transactions
5. View dashboard with statistics
6. Send reminders via WhatsApp

## Development

### Running in Development Mode

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

### Building for Production

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
# Serve the build folder with any static server
```

## Deployment

### Frontend
Deploy to Vercel, Netlify, or any static hosting service.

### Backend
Deploy to Render, Railway, or any Node.js hosting service.

### Android
Build APK using Android Studio and distribute via APK file or Play Store.

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify MongoDB credentials

### CORS Errors
- Check FRONTEND_URL in backend .env
- Ensure backend CORS is configured correctly

### Session Issues
- Clear browser cookies
- Check SESSION_SECRET in backend .env

### Android WebView Not Loading
- Update WEB_APP_URL in MainActivity.java
- Ensure device and server are on same network
- Check firewall settings

### OTP SMS Not Working
- Ensure Twilio credentials are configured in .env
- Check your Twilio account balance
- Verify the phone number format (include country code, e.g., +91 for India)
- Check Twilio console for error logs
- If credentials not configured, OTP will be logged to backend console

## Setting Up Twilio for OTP SMS (Optional)

The app supports OTP authentication via SMS using Twilio. To enable real SMS delivery:

1. **Create a Twilio Account**
   - Go to [twilio.com](https://www.twilio.com) and sign up
   - Verify your phone number

2. **Get Twilio Credentials**
   - Navigate to Console → Settings → API Keys
   - Copy Account SID and Auth Token

3. **Purchase a Phone Number**
   - Go to Console → Phone Numbers → Buy a Number
   - Purchase a phone number for sending SMS

4. **Configure Environment Variables**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `.env` and add:
   ```
   TWILIO_ACCOUNT_SID=your_actual_account_sid
   TWILIO_AUTH_TOKEN=your_actual_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

5. **Restart Backend**
   ```bash
   npm run dev
   ```

**Note:** If Twilio is not configured, OTPs will be logged to the backend console for development purposes.

## Future Enhancements

- UPI payment integration
- PDF receipt generation
- Advanced analytics dashboard
- Multi-language support
- Push notifications
- Offline support
- Biometric authentication

## License

ISC
