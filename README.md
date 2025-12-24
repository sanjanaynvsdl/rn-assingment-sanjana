# Pocket Expenses

![App Screenshot](./app-screenshot.png)

A full-stack mobile expense tracking application built with React Native and Node.js.

---

## Tech Stack

### Frontend
- React Native (Expo SDK 54)
- Expo Router (File-based navigation)
- AsyncStorage (Local data persistence)
- Context API (State management)

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- RESTful API

---

## Features

### User Authentication
- User registration with email and password
- Secure login with JWT tokens
- Token persistence using AsyncStorage
- Password change functionality
- Logout with token cleanup

### Expense Management
- Add new expenses with amount, category, payment method, and description
- View all expenses with category filters
- Edit existing expenses
- Delete expenses with confirmation
- Offline support with local storage and sync capability

### Categories
- Food
- Transport
- Shopping
- Entertainment
- Bills
- Health
- Education
- Other

### Payment Methods
- Cash
- Credit Card
- Debit Card
- UPI
- Net Banking
- Other

### Statistics and Insights
- Daily expense summary
- Monthly expense breakdown
- Category-wise spending analysis with progress bars
- Bar chart visualization
- Spending insights comparing current vs previous month
- Percentage change indicators

---

## App Screens

### Authentication Flow
1. Splash Screen - App branding with animated logo
2. Login Screen - Email and password authentication
3. Signup Screen - New user registration

### Main App (Tab Navigation)

| Tab | Screen | Description |
|-----|--------|-------------|
| Home | Dashboard | Monthly spending total, today's spending, quick category stats, recent transactions list |
| Expenses | Expense List | Full expense history with category filter chips, pull-to-refresh, long-press to delete |
| Add (+) | Add Expense | Form with amount input, category grid selection, payment method chips |
| Stats | Statistics | Period tabs (Day/Week/Month/Year), bar chart, category breakdown with progress bars, insights |
| Profile | Settings | User info, change password, logout |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and receive JWT token |
| GET | /api/auth/me | Get current user profile |
| PUT | /api/auth/profile | Update user profile |
| PUT | /api/auth/change-password | Change password |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/expenses | Create new expense |
| GET | /api/expenses | Get all expenses (supports filters: category, startDate, endDate, page) |
| GET | /api/expenses/:id | Get single expense |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/expenses/stats/daily | Get daily expense summary |
| GET | /api/expenses/stats/monthly | Get monthly breakdown with category totals |
| GET | /api/expenses/stats/categories | Get category-wise aggregation |
| GET | /api/expenses/stats/insights | Get spending comparison insights |

### Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/expenses/sync | Sync offline expenses to server |

---

## Project Structure

```
pocket-expenses/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Expense.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── expenses.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── expense-app/
    ├── app/
    │   ├── (auth)/
    │   │   ├── splash.tsx
    │   │   ├── login.tsx
    │   │   └── signup.tsx
    │   ├── (tabs)/
    │   │   ├── index.tsx
    │   │   ├── expenses.tsx
    │   │   ├── add.tsx
    │   │   ├── stats.tsx
    │   │   └── profile.tsx
    │   ├── _layout.tsx
    │   └── index.tsx
    ├── constants/
    │   ├── theme.ts
    │   └── categories.ts
    ├── context/
    │   └── AuthContext.tsx
    ├── services/
    │   └── api.ts
    └── package.json
```

---

## Setup Instructions

### Backend

1. Navigate to backend folder
   ```
   cd backend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create .env file with the following variables
   ```
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. Start the server
   ```
   npm start
   ```

### Frontend

1. Navigate to expense-app folder
   ```
   cd expense-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Update API URL in services/api.ts if needed (for physical device testing, use your machine IP)

4. Start Expo
   ```
   npx expo start
   ```

5. Scan QR code with Expo Go app or run on simulator

---

## Data Models

### User
- name (String, required)
- email (String, required, unique)
- password (String, hashed)
- currency (String, default: USD)
- createdAt (Date)

### Expense
- user (ObjectId, reference to User)
- amount (Number, required)
- category (String, enum)
- paymentMethod (String, enum)
- description (String)
- date (Date)
- syncStatus (String: synced/pending)
- localId (String, for offline sync)

---

## Security

- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 30 days
- Protected routes require valid Bearer token in Authorization header
- User can only access their own expenses

---

## Offline Support

The app stores expenses locally using AsyncStorage when offline. When connectivity is restored, pending expenses can be synced to the server using the sync endpoint. Each local expense has a unique localId to prevent duplicates during sync.
