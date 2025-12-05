# AI-Based Smart Attendance System (faceflow)

This is an advanced, AI-powered smart attendance system featuring face recognition, emotion detection, cloud synchronization, and voice interaction. The application is built with a modern web stack and is designed to be robust, scalable, and user-friendly for educational or corporate environments.

## Key Features

- **Facial Recognition Attendance**: Captures attendance automatically by recognizing registered users' faces via a webcam.
- **Emotion Detection**: Analyzes the user's emotion (e.g., Happy, Sad, Neutral) during attendance capture to provide insightful analytics.
- **AI-Powered Voice Commands**: Interact with the system using voice commands to navigate, add users, and perform other actions.
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
- **Hosting**: Deployed on [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

## Getting Started

To get started with the application, log in with one of the provided user roles (Admin or Teacher) to explore the features. The main functionalities are accessible through the sidebar navigation.
