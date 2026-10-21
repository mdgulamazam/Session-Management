# Session Management Demo App

A secure session-based authentication application built with React, Django, and PostgreSQL.

## Features

-  Login using email and password
- Custom Django user model with hashed passwords
- PostgreSQL database integration
- Server-side Django session management
- HttpOnly session cookie
- CSRF protection for authentication requests
- Automatic session expiry after 10 minutes of inactivity
- Activity tracking to maintain active sessions
- Protected dashboard displaying the logged-in user's email
- Secure logout and session termination
- Login rate limiting: 5 attempts per minute
- Responsive user interface built with React and Tailwind CSS

## Technologies Used

**Frontend:** React, JavaScript, Vite, Tailwind CSS

**Backend:** Python, Django, Django REST Framework, Django sessions

**Database:** PostgreSQL

**Security:** CSRF protection, password hashing, HttpOnly cookies, session expiry, rate limiting


## Project Structure

```text
session-management-demo/
├── backend/
│   ├── accounts/
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── config/
│   └── manage.py
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Requirements

- Python
- Node.js and npm
- PostgreSQL
- Git


## Development Process:

### Step 1: Project Planning

A session management application with secure login, protected dashboard access, automatic session expiration, and logout functionality.

Selected React for the frontend and Django for the backend.

### Step 2: Project Setup

The main project directory named `session-management-demo`.

Then, organized the project into two main parts:

- `backend` — Django application
- `frontend` — React application built with Vite

Also created a Python virtual environment named `venv` to manage backend dependencies.

### Step 3: Django Backend Setup

Create a Django project named `config` inside the backend directory and configured the application settings.

Installed the required Python packages for the backend, including Django, CORS support, and login rate limiting.

### Step 4: Custom User Model

Create  an `accounts` Django application and implemented a custom User Model.

The model uses email as the login identifier and includes fields for:

- Email address
- Hashed password
- Account creation timestamp
- Account update timestamp

Configure Django to use this custom model through `AUTH_USER_MODEL`.

### Step 5: Database Configuration and Migrations

Configure the database through Django's `settings.py` file.

Then applied Django migrations to create the required database tables and created an administrator account for testing.

### Step 6: Authentication and CSRF Protection

Implemented the login functionality in Django.

The backend validates the submitted email and password using Django's authentication system.

Also configured CSRF protection to help secure authentication requests from the React frontend.

### Step 7: Session Management

Implemented server-side session management using Django's session framework.

After successful login, Django creates an authenticated session and sends a session cookie to the browser.

Configure the session cookie to use the HttpOnly setting and set the inactivity timeout to 600 seconds (10 minutes).

### Step 8: Login Rate Limiting

Implemented login rate limiting to restrict repeated login attempts.

The application is configured to limit login attempts to five requests per minute according to the configured rule.


### Step 9: Backend API Endpoints

Created backend endpoints to handle the main authentication operations:

- CSRF 
- login
- Dashboard
- Activity
- logout

### Step 10: React Frontend Development

Created the React frontend using Vite.

Developed the login interface with email and password fields, input validation, loading states, and error messages.

Connected the frontend to the Django backend using HTTP requests with credentials enabled.

### Step 11: Dashboard and Session Countdown

Implemented the authenticated dashboard to display the logged-in user's email and session status.

Added a countdown timer to visually show the configured session timeout and a session verification action.

The backend remains responsible for validating whether a session is still valid.

### Step 12: Activity Tracking and Automatic Expiration

Added frontend activity tracking for events such as mouse movement, keyboard input, clicks, scrolling, and touch interactions.


The backend checks the recorded activity timestamp. When the inactivity limit is reached, the session is invalidated and the application displays an expiration message.

### Step 13: Logout Functionality

Implemented the logout operation to terminate the authenticated Django session.

The frontend clears the logged-in user's state and returns to the login page.

Also configured the logout response to clear the session cookie.

### Step 14: User Interface Styling

Styled the application using Tailwind CSS.

Designed a responsive interface with an orange-themed login page, dashboard information, session countdown, status indicators, and login/logout controls.

### Step 15: Application Testing

Tested the main application features during development:

- Valid login
- Invalid login credentials
- Login rate limiting
- Dashboard access without authentication
- Display of the authenticated user's email
- Session countdown
- Logout
- Ten-minute inactivity timeout
- Session-expiration notification

The login, rate-limiting, unauthenticated dashboard, countdown, logout, and inactivity-expiration tests were successful during development.

### Step 16: Documentation and Final Review

I documented the project structure, installation steps, technologies, features, and testing process in this README file.


## Final Outcome

The completed application demonstrates session-based authentication using React and Django. It supports protected dashboard access, CSRF protection, login rate limiting, activity tracking, and automatic session expiration after inactivity.


**M**

