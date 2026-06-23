# Digital Work Handover & Continuity System

A full-stack web application for managing work handovers, ensuring business continuity, and automating follow-ups when employees are unavailable.

## Features

- **Role-Based Access Control**: Employee, Manager, and Admin roles
- **Task Management**: Create, update, and manage tasks with backup owners
- **Handover Notes**: Detailed knowledge transfer documentation
- **Availability Tracking**: Mark leave status and set emergency contacts
- **Dashboard Analytics**: Real-time metrics and risk alerts
- **UiPath Integration**: Automated reminders and alerts (conceptual)

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
final main project/
├── server.js                 # Express server entry point
├── package.json              # Node.js dependencies
├── models/                   # MongoDB models
│   ├── User.js
│   ├── Task.js
│   ├── HandoverNote.js
│   └── Availability.js
├── routes/                   # API routes
│   ├── auth.js
│   ├── tasks.js
│   ├── handovers.js
│   ├── availability.js
│   └── dashboard.js
├── js/                       # Frontend JavaScript
│   ├── api.js               # API client
│   ├── auth.js              # Authentication handling
│   ├── dashboard.js         # Employee dashboard
│   ├── tasks.js             # Task management
│   ├── handovers.js         # Handover notes
│   ├── availability.js      # Availability management
│   ├── manager-dashboard.js
│   └── admin-dashboard.js
├── css/
│   └── style.css            # Stylesheet
└── *.html                    # Frontend pages
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/workhandover
   JWT_SECRET=your-secret-key-change-in-production
   NODE_ENV=development
   ```

3. **Start MongoDB**
   - If using local MongoDB:
     ```bash
     mongod
     ```
   - Or use MongoDB Atlas and update `MONGODB_URI` in `.env`

4. **Start the Server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open `http://localhost:3000` in your browser
   - Register a new account or use existing credentials

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Handovers
- `GET /api/handovers` - Get all handover notes
- `GET /api/handovers/:id` - Get handover by ID
- `POST /api/handovers` - Create handover note
- `PUT /api/handovers/:id` - Update handover note
- `POST /api/handovers/:id/acknowledge` - Acknowledge handover
- `POST /api/handovers/:id/complete` - Complete handover

### Availability
- `GET /api/availability/me` - Get current user's availability
- `PUT /api/availability/me` - Update availability
- `GET /api/availability` - Get all availabilities (manager/admin)
- `GET /api/availability/user/:userId` - Get user availability

### Dashboard
- `GET /api/dashboard/employee` - Employee dashboard data
- `GET /api/dashboard/manager` - Manager dashboard data
- `GET /api/dashboard/admin` - Admin dashboard data
- `GET /api/dashboard/users` - Get all users

## UiPath Automation Integration

The system includes conceptual integration points for UiPath automation:

1. **Task Handover Deadlines**: Monitors tasks without backup owners
2. **Backup Ownership Validation**: Ensures critical tasks have backup owners
3. **Leave Without Documentation**: Alerts when employees are unavailable without handover notes
4. **Automated Reminders**: Sends notifications to backup owners and managers

To integrate with UiPath:
1. Set up UiPath Orchestrator API endpoints
2. Update the automation trigger functions in `js/dashboard.js` and `js/availability.js`
3. Configure webhook endpoints in UiPath to receive system events

## Usage

1. **Register/Login**: Create an account with your role (employee/manager/admin)
2. **Create Tasks**: Add tasks and assign backup owners
3. **Create Handover Notes**: Document knowledge transfer for tasks
4. **Update Availability**: Mark your leave status
5. **Monitor Dashboard**: View metrics and alerts

## Development

- Frontend files are served statically from the root directory
- API routes are prefixed with `/api`
- JWT tokens are stored in localStorage
- All API requests include authentication headers

## License

ISC
