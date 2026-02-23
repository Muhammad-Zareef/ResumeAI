# ResumeAI – AI-Powered Resume Analyzer & Job Tracker

ResumeAI is a **full-stack web application** that analyzes PDF resumes against specific job descriptions and generates **AI-powered feedback** to improve ATS compatibility and interview success rates.

It helps users understand how well their resume matches a job and provides **actionable improvements**, keyword gap analysis, and an **optimized resume version**.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based login & logout
- Secure password hashing with bcrypt
- Role-based authorization
- Dedicated **Admin Dashboard**

### 📄 Resume Analysis
- Upload PDF resumes
- Parse resume content using `pdf-parse`
- AI-powered feedback using **Gemini API**
- Resume **overall score**
- ATS compatibility check
- Job match percentage
- Missing skills detection
- Grammar & improvement suggestions
- Improved resume version (text format)
- Copy & download optimized resume

### 💼 Job Management
- Create, Read, Update, Delete (CRUD) jobs
- Select a job before analyzing a resume

### 🕘 User History
- View past resume analyses
- Delete analysis records

---

## 🧠 How It Works

1. **Create a Job** you are applying for  
2. **Upload your resume** (PDF format)  
3. **Select the job** you want to analyze against  
4. Get **instant AI feedback**, including:
   - Overall Score  
   - ATS Compatibility  
   - Job Match  
   - Missing Skills  
   - Improvement Suggestions  
   - Optimized Resume (text format)  

---

## 🛠️ Tech Stack

### Frontend
- HTML  
- Tailwind CSS  
- JavaScript  
- Font Awesome  
- SweetAlert  
- Axios  

### Backend
- Node.js  
- Express.js  
- MongoDB  
- Mongoose  
- JWT Authentication  
- bcrypt  
- express-fileupload  
- pdf-parse  

### AI Integration
- Google **Gemini API**

---

## 📂 REST API Capabilities

- Auth APIs (Login / Register / Logout)
- Resume upload & analysis APIs
- Job CRUD APIs
- User analysis history APIs
- Admin management APIs
