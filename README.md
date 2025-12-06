# AI-Based Smart Attendance System (faceflow)

This is an advanced, AI-powered smart attendance system featuring face recognition, emotion detection, cloud synchronization, and voice interaction. The application is built with a modern web stack and is designed to be robust, scalable, and user-friendly for educational or corporate environments.

## Key Features

- **Facial Recognition Attendance**: Captures attendance automatically by recognizing registered users' faces via a webcam.
- **Emotion Detection**: Analyzes the user's emotion (e.g., Happy, Sad, Neutral) during attendance capture to provide insightful analytics.
- **AI-Powered Voice Commands**: Interact with the system using voice commands to navigate, add users, and perform other actions.
- **Automated Email Notifications**: Send email notifications to students who are marked as absent.
- **Role-Based Access Control**: Differentiates between 'Admin' and 'Teacher' roles, providing tailored views and permissions for each.
- **Real-Time Cloud Sync**: All data is stored and synchronized in real-time with Google Firestore, ensuring data consistency across the application.
- **AI-Generated Summaries**: Provides AI-generated summaries of attendance reports to quickly identify trends and insights.
- **Dynamic User Management**: Admins can manage teachers, and teachers can manage the students assigned to their subjects.
- **Personalized Audio Greetings**: Generates a text-to-speech audio greeting for users upon successful attendance capture.

## Technology Stack

This project is built with the following technologies:

- **Frontend**: [Next.js](https://nextjs.org/) with React and TypeScript.
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/) for beautifully designed, accessible components.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a utility-first styling approach.
- **Generative AI**: [Google's Gemini models](https://ai.google.dev/) accessed via [Genkit](https://firebase.google.com/docs/genkit), the open-source GenAI framework from Google.
- **Backend & Database**: [Firebase](https://firebase.google.com/) for authentication and [Firestore](https://firebase.google.com/docs/firestore) for the database.
- **Email**: [Nodemailer](https://nodemailer.com/) for sending emails via Gmail.
- **Hosting**: Deployed on [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

## Getting Started

### Default Login Credentials

To make testing easier, you can sign up and log in with the following roles. The Teacher login is on the main login page. To create an Admin, you will need to add them directly in your Firebase Authentication console.

- **Admin Login:**
    -   **Email:** `admin@gmail.com`
    -   **Password:** `admin123`

- **Teacher Login:**
    -   **Email:** `teacher@example.com`
    -   **Password:** `teacher123`

## Running the Project Locally

To run this project on your local machine, you'll need to have [Node.js](https://nodejs.org/) installed.

### 1. Clone the Repository

Clone this repository to your local machine:

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 3. Environment Variables

The project requires environment variables for Google's AI models and for sending emails.

1.  Create a file named `.env` in the root of the project.
2.  Add your Gemini API key and email credentials to the file. See the sections below for how to get these values.

Your final `.env` file should look like this:
```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-google-app-password
```

#### Get a Gemini API Key
Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

#### Set Up Email Credentials for Notifications
To send emails to absent students, the application uses your Gmail account. For security, you must use a special **App Password** instead of your regular password.

1.  **Enable 2-Step Verification**: If you haven't already, enable 2-Step Verification on your Google Account. You can do this at [myaccount.google.com/security](https://myaccount.google.com/security).
2.  **Create an App Password**:
    *   Go to your App Passwords page: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
    *   For "Select app", choose **"Other (Custom name)"**.
    *   Name it something like **"faceflow App"** and click **"Generate"**.
    *   Google will show you a 16-character password. **This is your `EMAIL_PASS`**. Copy it immediately, as you won't see it again.
3.  **Update `.env`**:
    *   Set `EMAIL_USER` to your Gmail address (`travel19123003@gmail.com`).
    *   Set `EMAIL_PASS` to the 16-character App Password you just generated.


### 4. Run the Development Servers

This project requires two separate development servers to be running at the same time: one for the Next.js application and one for the Genkit AI flows.

1.  **Run the Next.js Dev Server:**
    Open a terminal and run:
    ```bash
    npm run dev
    ```
    This will start the web application, typically on `http://localhost:9002`.

2.  **Run the Genkit Dev Server:**
    Open a **second terminal** and run:
    ```bash
    npm run genkit:watch
    ```
    This starts the Genkit development server, which runs your AI flows. It also watches for changes in your AI-related files and reloads them automatically.
