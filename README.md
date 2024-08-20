# WikiEvolution

WikiEvolution is a web application built with React and Flask. This project aims to provide an interface for tracking the evolution of Wikipedia articles over time. The frontend is developed using React, and the backend is powered by Flask.

## Getting Started

To get the project up and running on your local machine, follow the steps below.

### Prerequisites

Make sure you have the following installed on your system:

- Node.js and npm (for frontend)
- Python 3 and pip (for backend)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/mahi01agarwal/WikiEvolution.git
   cd WikiEvolution
   ```

2. **Install frontend dependencies:**

   Navigate to the `client` directory and install the npm dependencies.

   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies:**

   Navigate to the `server` directory and install the Python dependencies.

   ```bash
   cd ../server
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the frontend development server:**

   In the `client` directory, run:

   ```bash
   npm run dev
   ```

2. **Start the backend server:**

   In the `server` directory, run:

   ```bash
   python app.py
   ```

### Note

For now, the application may not display data as expected since the dataset required for the project has not been uploaded to the repository. The application will function as intended after the data is deployed.

