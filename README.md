# Web Application Firewall (WAF) Demonstration Project

This project demonstrates a functional Web Application Firewall (WAF) protecting a deliberately vulnerable full-stack blog application. The WAF is configured using **Nginx** and **ModSecurity** with the **OWASP Core Rule Set (CRS)** to detect and block common web attacks like SQL Injection and Cross-Site Scripting (XSS).

## 🚀 Key Features

- **Web Application Firewall:** Nginx server acting as a reverse proxy with ModSecurity and OWASP CRS to inspect and filter HTTP traffic.
- **Vulnerable Application:** A full-stack blog application built with React and Node.js, featuring intentional SQL Injection and Stored XSS vulnerabilities for testing purposes.
- **Real-time Threat Blocking:** The WAF is configured to block malicious requests and return a `403 Forbidden` status.
- **Dynamic UI Feedback:** The frontend application provides immediate feedback to the user when a request is blocked by the WAF and clears the malicious input.
- **Containerized Environment:** The entire stack (WAF, backend, frontend) is managed with Docker Compose for easy setup and consistent deployment.

## 🛠️ Tech Stack

- **WAF:** Nginx, ModSecurity, OWASP Core Rule Set (CRS)
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js, SQLite3
- **Containerization:** Docker, Docker Compose

## 📁 Project Structure

```
.
├── backend/            # Node.js backend application
├── newprjt/frontend/   # React frontend application
├── nginx/              # Nginx and ModSecurity configuration
├── logs/               # Log files for WAF and access
├── docker-compose.yml  # Docker Compose file to orchestrate services
└── README.md           # This file
```

## ⚙️ Setup and Installation

To get this project up and running locally, you'll need to have **Docker** and **Docker Compose** installed.

**Step 1: Clone the repository**
```bash
git clone https://github.com/petchimurugan-10/Web_application_firewall.git
cd Web_application_firewall
```

**Step 2: Build and run the services**

Use Docker Compose to build the images and start all the services in detached mode.

```bash
docker-compose up --build -d
```

This command will:
1. Build the Docker images for the `waf` and `backend` services.
2. Start the containers. The `waf` service (Nginx) will be accessible on port `8080`.

**Step 3: Run the frontend development server**

The frontend is designed to be run on your local machine and will proxy API requests to the WAF.

```bash
# Navigate to the frontend directory
cd newprjt/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will now be running on `http://localhost:5173`.

## 🔬 How to Demonstrate the WAF

You can now test the WAF's effectiveness by attempting to perform common web attacks.

#### 1. Testing for SQL Injection

1.  Open your browser and navigate to `http://localhost:5173`.
2.  In the search bar at the top right, enter a malicious SQL query.
    -   **Example:** `' OR 1=1 --`
3.  Click the "Search" button.
4.  **Result:** You will see a browser alert saying "**WAF Blocked: Your search request was blocked...**". The search input field will then be cleared automatically.

#### 2. Testing for Cross-Site Scripting (XSS)

1.  On the home page, click on any article to go to the post detail view.
2.  Scroll down to the "Leave a Comment" section.
3.  Enter a name in the "Your name" field.
4.  In the "Your comment" field, enter a malicious script.
    -   **Example:** `<script>alert('XSS attack!');</script>`
5.  Click the "Post Comment" button.
6.  **Result:** You will see a browser alert saying "**WAF Blocked: Your comment was blocked...**". The name and comment fields will be cleared automatically.

In both cases, you can check the logs in the `logs/` directory or view the Docker container logs (`docker-compose logs waf`) to see the ModSecurity alerts.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
