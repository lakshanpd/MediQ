# MediQ - Digital Token Management System 🏥📱


<img  height="250" alt="MediQ A Digital Token Management System for Medical Centres" src="https://github.com/user-attachments/assets/a1fa8c81-ff78-4dfd-b55a-112eeece8b5e" />


**MediQ** is a mobile application designed to modernize queue management in medical centers. It replaces traditional paper tokens with a digital system, allowing patients to request tokens remotely and doctors to manage patient flow efficiently in real-time.


---

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)

---

## 🚀 About the Project

In many small and medium-scale medical centers, patient queues are managed using manual paper tokens. This leads to:
* **Physical Presence Required:** Patients must visit early just to get a number.
* **Uncertain Wait Times:** No visibility on "Now Serving" numbers, causing overcrowding.
* **Administrative Burden:** Staff manually track skipped numbers and manage disputes.

**MediQ** solves these issues by providing:
* **For Patients:** Remote token requests, live queue tracking, and real-time push notifications.
* **For Doctors:** A secure dashboard to manage sessions, accept/reject requests, and control the live queue.

---

## ✨ Key Features

### 🧑‍⚕️ For Doctors
* **Secure Authentication:** Role-based login for authorized staff.
* **Session Management:** Create, start, pause, and end consultation sessions (Morning/Evening).
* **Request Management:** View incoming token requests and **Accept** or **Reject** them.
* **Live Queue Control:**
    * Call the **Next** patient.
    * Mark patients as **Served** or **Absent**.

### 👤 For Patients
* **Remote Booking:** "Choose Yourself" interface (no login required) to request a token.
* **Smart Form:** Select Specialization -> Doctor -> Available Session.
* **Live Tracking:** View "Your Token" vs. "Current Token" in real-time.
* **Push Notifications:** Get alerted when your request is accepted or when it's your turn.

---

## 🛠 Tech Stack

* **Framework:** [React Native](https://reactnative.dev/) (via [Expo SDK](https://expo.dev/))
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
* **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
* **Backend (BaaS):** [Google Firebase](https://firebase.google.com/)
    * **Authentication:** Secure sign-in.
    * **Cloud Firestore:** Real-time NoSQL database.
    * **Cloud Messaging:** Push notifications.

---

## 🏗 Architecture

<img width="1507" height="580" alt="MediQ Architecture" src="https://github.com/user-attachments/assets/2a683769-68bb-4560-b1a1-6a664a938a52" />

The app follows a **Serverless Architecture** to ensure low latency and real-time updates.

* **Real-time Sync:** Uses Firestore listeners to instantly reflect token status,queue changes across all devices.
* **Context-Awareness:** Updates Doctors and Patients via Push Notifications.

---

## 🏁 Getting Started

### Prerequisites
* Node.js (LTS version recommended)
* Expo Go app installed on your physical device (iOS/Android) or an Emulator.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/lakshanpd/MediQ.git]
    cd mediq
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    * Create a project in the [Firebase Console](https://console.firebase.google.com/).
    * Enable **Authentication** and **Firestore**.
    * Create a `.env` with follwoing details.
     ```bash
     EXPO_PUBLIC_FIREBASE_API_KEY=
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
     EXPO_PUBLIC_FIREBASE_APP_ID=
     EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

     EXPO_PUBLIC_PUSH_TOKEN_KEY=
     ```

4.  **Run the application:**
    ```bash
    npx expo start
    ```

5.  **Scan the QR code** with the Expo Go app on your phone.

---
