# Chapter 7: System Screenshots

This chapter provides a visual walkthrough of the "faceflow" application's key features and user interfaces. The following screenshots are recommended for inclusion in the project report to demonstrate the system's functionality.

### 1. User Authentication & Roles

*   **Login Page**: The main login screen for teachers and admins.
*   **Teacher Dashboard**: The landing page for a logged-in teacher, showing summary statistics (Total Students, Present Today) and the Emotion Distribution chart.
*   **Admin Dashboard / Reports Page**: The landing page for a logged-in admin, showing system-wide attendance and user data.

### 2. Core Attendance Capture Feature

*   **Capture Page - Initial State**: The "Capture Attendance" screen with the webcam view active, before a scan is initiated.
*   **Capture Page - Successful Recognition**: The result of a successful scan, showing the recognized student's avatar, name, status ("Present"), and detected emotion.
*   **Capture Page - User Already Marked Present**: The result screen showing a user who has already been scanned for the day, with the status "Already Marked Present".
*   **Capture Page - Recognition Failure**: A screenshot of the toast notification that appears when the AI cannot identify a registered user.
*   **Capture Page - Not Registered for Subject Error**: The toast notification that appears if a recognized student is not enrolled in the selected subject.
*   **End Session Confirmation**: The dialog box asking for confirmation before marking remaining students as absent.

### 3. Reporting and Analytics

*   **Attendance Reports Page**: The main reports screen showing the detailed "Attendance Log" table.
*   **Emotion Distribution Chart**: A close-up of the bar chart that visualizes the breakdown of detected emotions.
*   **AI Summary Card**: The "AI Summary" component, showing a generated analysis of the attendance data.
*   **Archived Reports View**: The "Archived Reports" page, showing the accordion layout of past sessions.

### 4. User and Subject Management

*   **Student Management (Teacher View)**: The "Student Management" table as seen by a teacher, listing only the students in their assigned subjects.
*   **Teacher Management (Admin View)**: The "Teacher Management" table as seen by an admin, listing all teachers in the system.
*   **Add New Student Dialog**: The pop-up form for adding a new student, complete with fields for name, register number, email, and photo upload.
*   **Add New Teacher Dialog (Admin View)**: The pop-up form an admin uses to create a new teacher account and assign them subjects.
*   **Subject Management Page**: The table listing all available subjects, showing the teacher's view or the admin's view with assigned teachers.

### 5. AI-Powered Features

*   **Voice Command Dialog**: The pop-up interface for using voice commands to navigate the application.
*   **Automated Email Notification**: An example of the email sent to an absent student (a screenshot from a Gmail inbox).
*   **Personalized Audio Greeting**: While hard to screenshot, you could describe the audio greeting that plays upon successful recognition.
