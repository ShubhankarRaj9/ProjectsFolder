# Student Admin Complaint Portal

A full-stack web application for managing student complaints in an educational institution. The system supports multiple user roles (students, faculty, and administrators) and provides role-specific features for complaint submission, tracking, and resolution.

## Features

### User Management
- Multi-role authentication system (Student, Faculty, Admin)
- Secure login and registration
- Role-based access control
- Token-based authentication using JWT

### Student Features
- Submit complaints across multiple categories:
  - Academic Issues
  - Infrastructure Problems
  - Administration Complaints
  - Technical Difficulties
  - Other Issues
- Track complaint status
- View admin responses
- Delete own complaints
- Optional file attachments for complaints

### Faculty Features
- View student complaints
- Submit own complaints
- Track complaint status
- View admin responses
- Delete own complaints

### Admin Features
- Dashboard with complaint statistics
- View all complaints with filtering options:
  - Pending complaints
  - Resolved complaints
  - All complaints
- Resolve complaints with resolution notes
- Delete complaints
- View complaint statistics

## Tech Stack

### Frontend
- Vanilla JavaScript
- HTML5
- CSS3
- RESTful API integration
- Token-based authentication
- File upload handling

### Backend
- Node.js
- Express.js
- MongoDB (Database)
- JSON Web Tokens (JWT) for authentication
- Multer for file uploads
- CORS enabled

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── database.js      # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── complaintController.js # Complaint handling
│   │   └── userController.js    # User management
│   ├── middlewares/
│   │   ├── authMiddleware.js    # Auth verification
│   │   ├── errorHandler.js      # Error handling
│   │   └── roleMiddleware.js    # Role-based access
│   ├── models/
│   │   ├── Complaint.js        # Complaint schema
│   │   └── User.js            # User schema
│   ├── routes/
│   │   ├── authRoute.js       # Auth endpoints
│   │   ├── complaintRoute.js  # Complaint endpoints
│   │   └── userRoute.js       # User endpoints
│   └── server.js              # Express server setup
├── frontend/
│   ├── apis/
│   │   └── api.js            # API integration
│   ├── HomePages/
│   │   ├── adminPage/        # Admin dashboard
│   │   ├── facultyPage/      # Faculty interface
│   │   └── studentPage/      # Student interface
│   ├── logInPage/           # Authentication UI
│   └── SignInPage/          # Registration UI
```

## Setup and Installation

1. Prerequisites:
   - Node.js (v14 or higher)
   - MongoDB (v4.4 or higher)

2. Clone the repository:
   ```bash
   git clone <repository-url>
   cd StudentAdminComplaintPortal
   ```

3. Backend Setup:
   ```bash
   cd backend
   npm install
   ```
   Create a .env file with:
   ```env
   PORT=4000
   DATABASE_URL=mongodb://localhost:27017/complaintDatabase
   JWT_SECRET=complaint_portal_secret_key_2024_secure
   ```

4. Frontend Setup:
   - No build process required
   - Serve using any static file server

5. Start the Application:
   ```bash
   # Start MongoDB (if not running as a service)
   mongod

   # Start backend (from backend directory)
   npm run dev

   # Serve frontend (example using VS Code Live Server)
   # Open index.html in VS Code and use Live Server extension
   ```

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration

### Complaints
- POST `/api/complaints/submit` - Submit new complaint
- GET `/api/complaints/my-complaints` - Get user's complaints
- GET `/api/complaints/admin/dashboard` - Get admin dashboard data
- PATCH `/api/complaints/:id/resolve` - Resolve complaint
- DELETE `/api/complaints/:id` - Delete complaint

### Users
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update user profile

## Security Features

- JWT token authentication
- Password hashing using bcrypt
- Role-based middleware protection
- File upload validation
- CORS protection
- Error handling middleware

## Frontend Routes

- `/logInPage/login.html` - Login page
- `/SignInPage/SignIn.html` - Registration page
- `/HomePages/studentPage/student.html` - Student dashboard
- `/HomePages/facultyPage/faculty.html` - Faculty dashboard
- `/HomePages/adminPage/admin.html` - Admin dashboard

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## Development

To contribute to this project:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
