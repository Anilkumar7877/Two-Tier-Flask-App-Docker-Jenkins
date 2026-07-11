# FocusFlow // Two-Tier Flask-MySQL App

A beautiful, containerized task management single-page application (SPA) designed with a clean architecture that strictly separates frontend and backend code components.

## 🚀 Running Locally with Docker (Recommended)

Running the application using Docker Compose is the easiest way to launch it, as it automatically provisions and links the MySQL database and the Flask API container without requiring local installations.

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose).

### Launch Steps
1. Open a terminal in the project directory.
2. Spin up the containers:
   ```bash
   docker-compose up --build
   ```
3. Wait for the database health checks to pass and Flask to boot.
4. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

### Stopping
To stop the services while preserving your created tasks:
```bash
docker-compose down
```
To stop the services and erase the database volume:
```bash
docker-compose down -v
```

---

## 🛠️ Running Locally without Docker (Manual Setup)

If you prefer to run the components directly on your local system, follow these instructions.

### Prerequisites
- Install **Python 3.10+**
- Install **MySQL Server** and ensure the MySQL service is running.

### 1. Database Configuration
1. Open your MySQL client and log in as root (or your custom user).
2. Run the initialization script located at `db/init.sql` to create the database and seed tables:
   ```sql
   SOURCE db/init.sql;
   ```
   *(Or copy-paste the SQL contents directly into your terminal or database manager).*

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables to match your local MySQL configuration:
   ```bash
   # Windows PowerShell
   $env:MYSQL_HOST="localhost"
   $env:MYSQL_USER="root"
   $env:MYSQL_PASSWORD="your_password"
   $env:MYSQL_DB="appdb"

   # macOS / Linux / Git Bash
   export MYSQL_HOST="localhost"
   export MYSQL_USER="root"
   export MYSQL_PASSWORD="your_password"
   export MYSQL_DB="appdb"
   ```
5. Start the backend Flask server:
   ```bash
   python app.py
   ```

### 3. Accessing the Application
Since the Flask app is configured to serve the frontend assets statically from the `../frontend` folder, you do not need a separate frontend server.
Simply open your browser and navigate to:
```
http://localhost:5000
```

---

## 📂 Project Architecture

```
├── backend/
│   ├── app.py                # Flask REST API server and static host
│   ├── requirements.txt      # Python dependencies (Flask, mysql-connector, CORS)
│   └── Dockerfile            # Container build specification
├── db/
│   └── init.sql              # Database setup and seed tasks
├── frontend/
│   ├── index.html            # Core SPA dashboard layout
│   ├── styles.css            # Custom CSS styles (glassmorphism, dark theme)
│   └── app.js                # Vanilla JS client logic (fetch API)
├── docker-compose.yml        # Orchestration configuration
└── README.md                 # Project guide
```
