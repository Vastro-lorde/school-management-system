# Project Blueprint

## Overview

This project is a school management system built with Next.js, Mongoose, and NextAuth.js. It provides a comprehensive set of features for managing students, staff, classes, subjects, attendance, grades, and timetables.

## Features

*   **User Management:**
    *   User authentication with NextAuth.js and credentials provider.
    *   Role-based access control (student, teacher, staff, admin).
    *   User profiles for students and staff.
    *   User signup.
    *   User login.
    *   Forgot password and password reset functionality.
*   **JWT Service:**
    *   JWT generation and verification.
    *   Token-based authentication for securing API routes.
*   **Email Service:**
    *   Email service for sending password reset emails using Brevo SMTP.
*   **File Management:**
    *   Firebase Storage integration for file uploads, downloads, and deletions.
    *   `storageService.js` to abstract Firebase Storage operations.
    *   A dynamic API endpoint at `pages/api/files/[...slug].js` for handling file management CRUD.
*   **Constants Management:**
    *   A `constants` folder to centralize application-wide constants.
    *   `appDetails.js` for the application name.
    *   `env.js` for managing environment variables.
*   **Public Pages:**
    *   Home page (`pages/index.js`)
    *   Login page (`pages/login.js`)
    *   Signup page (`pages/signup.js`)
    *   Forgot Password page (`pages/forgot-password.js`)
    *   Reset Password page (`pages/reset-password.js`)
*   **Academic Management:**
    *   Class and subject management.
    *   Student enrollment in classes.
    *   Timetable creation and management.
*   **Student Tracking:**
    *   Attendance tracking.
    *   Grade management.
*   **API:**
    *   RESTful API for managing users, students, and other resources.

## Design and Styling

*   **Styling:** The application uses Tailwind CSS for styling.
*   **Components:** The application uses a basic set of React components for the UI.

## Current Plan

*   Created a `constants` folder in `src`.
*   Added `appDetails.js` to store the application name.
*   Added `env.js` to manage environment variables.
*   Refactored `storageService.js` to use the `FIREBASE_SERVICE_ACCOUNT` constant.
*   Refactored `src/server/db/config.js` to use the `MONGO_URI` constant.
*   Refactored `src/server/services/jwtService.js` to use the `JWT_SECRET` constant.
*   Refactored `src/server/services/emailService.js` to use `BREVO_API_KEY`, `EMAIL_FROM`, and `APP_NAME` constants.
