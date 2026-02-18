# 🏥 Medi Online Clinic

[![GitHub license](https://img.shields.io/github/license/yourusername/medi-online-clinic)](https://github.com/yourusername/medi-online-clinic/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/yourusername/medi-online-clinic)](https://github.com/yourusername/medi-online-clinic/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/yourusername/medi-online-clinic/pulls)
[![Node Version](https://img.shields.io/badge/node-18.x-green)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/react-18.x-blue)](https://reactjs.org)

A complete online clinic management system connecting patients with doctors. Book appointments, conduct video consultations, manage medical records, and process payments - all in one platform.

## ✨ Features

### For Patients 👤
- 🔍 Find doctors by specialty, location, and reviews
- 📅 Book and manage appointments
- 💳 Secure online payments
- 📁 View medical records and prescriptions
- 💬 Chat with doctors
- ⭐ Rate and review doctors
- 📱 Mobile-responsive design

### For Doctors 👨‍⚕️
- 📋 Manage schedule and availability
- 💰 Track earnings and withdraw funds
- 📝 Write digital prescriptions
- 📊 View patient history
- 🎥 Conduct video consultations
- ⭐ Respond to patient reviews

### For Admin 👑
- ✅ Verify doctor credentials
- 📊 Platform analytics and reports
- 💼 Manage all appointments and payments
- 🛡️ Moderate reviews and content
- ⚙️ Configure platform settings

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router DOM** - Navigation
- **Axios** - API requests
- **CSS Modules** - Styling
- **Socket.io-client** - Real-time chat
- **Stripe Elements** - Payment processing

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email service

### DevOps & Tools
- **Git & GitHub** - Version control
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Stripe** - Payment gateway
- **Postman** - API testing

## 📁 Project Structure
medi-online-clinic/
├── frontend/ # React application
│ ├── public/ # Static files
│ ├── src/ # Source code
│ └── package.json # Frontend dependencies
│
├── backend/ # Node.js application
│ ├── config/ # Configuration files
│ ├── controllers/ # Request handlers
│ ├── models/ # Database models
│ ├── routes/ # API routes
│ ├── middleware/ # Custom middleware
│ ├── utils/ # Helper functions
│ └── package.json # Backend dependencies
│
├── docs/ # Documentation
└── README.md # Project overview

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Git
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/medi-online-clinic.git
   cd medi-online-clinic
   ```

2. **Install Dependencies**
   ```bash
   # Install Backend Dependencies
   cd backend
   npm install

   # Install Frontend Dependencies
   cd ../frontend
   npm install
   ```