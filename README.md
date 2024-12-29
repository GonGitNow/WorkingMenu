# WorkingMenu

A comprehensive restaurant management system built with React Native and Express.js.

## Features

- User Authentication & Authorization
- Invoice Processing with Azure Document Intelligence
- Inventory Management
- Recipe Management
- Menu Building & Cost Calculation
- Real-time Sync with Offline Support

## Tech Stack

### Frontend
- React Native
- TypeScript
- Expo
- React Navigation
- AsyncStorage

### Backend
- Node.js
- Express.js
- MongoDB
- Azure Document Intelligence
- WebSocket
- Redis Cache

## Project Structure

```
/
├── src/              # Frontend source code
│   ├── assets/       # Static assets & test data
│   ├── components/   # Reusable UI components
│   ├── screens/      # Screen components
│   ├── navigation/   # Navigation setup
│   ├── services/     # API integrations
│   └── utils/        # Helper functions
│
└── backend/          # Backend source code
    ├── src/
    │   ├── models/   # Database models
    │   ├── routes/   # API routes
    │   ├── services/ # Business logic
    │   └── utils/    # Helper functions
    └── logs/         # Application logs
```

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB
- Azure Account (for Document Intelligence)
- Redis (optional, for caching)

### Installation

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd backend
npm install
```

4. Set up environment variables
- Copy `.env.example` to `.env`
- Fill in required credentials

5. Start the development server
```bash
# Frontend
npm start

# Backend
cd backend
npm run dev
```

## Environment Variables

### Frontend
- `API_URL`: Backend API URL
- `WEBSOCKET_URL`: WebSocket server URL

### Backend
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `AZURE_DOCUMENT_INTELLIGENCE_KEY`: Azure API key
- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`: Azure endpoint

## Contributing

This is a private repository. Please contact the repository owner for contribution guidelines.

## License

Private and Confidential - All rights reserved 