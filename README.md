📖 في صحبة كتاب الله - Quran Memorization Tracker
A comprehensive web application for tracking Quran memorization progress for students and managing Halaqas (study circles) for teachers.

✨ Features
For Teachers:
📊 Real-time statistics dashboard
👥 Manage multiple Halaqas (study circles)
📝 Add, edit, and delete students
📈 Track student progress visually
🎯 Set and monitor Khatm (completion) dates
🔍 Filter students by Halaqa
For Students:
🎓 Personal progress dashboard
📊 Visual progress circle (0-30 Juz)
🗺️ Interactive Juz grid map
🏆 Achievement badges system
⏱️ Days remaining until Khatm
💎 Motivational Quranic verses
🛠️ Tech Stack
Backend: Node.js, Express.js
Database: MongoDB with Mongoose ODM
Frontend: Vanilla HTML, CSS, JavaScript
Styling: Modern CSS with gradients and animations
📁 Project Structure
quran-hifz-tracker/
├── server.js              # Express server and API routes
├── package.json           # Project dependencies
├── Halaqa.js             # Halaqa model (Mongoose schema)
├── Student.js            # Student model (Mongoose schema)
├── public/               # Frontend files
│   ├── index.html        # Main landing page
│   ├── teacher.html      # Teacher dashboard
│   ├── student.html      # Student dashboard
│   ├── styles.css        # Shared styles (optional)
│   └── api.js            # Frontend API helper
└── README.md             # This file
🚀 Installation & Setup
Prerequisites
Node.js (v14 or higher)
MongoDB (installed and running)
Step 1: Install MongoDB
macOS (using Homebrew):

bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
Windows:

Download from MongoDB Download Center
Run the installer
Start MongoDB service from Services app
Linux (Ubuntu/Debian):

bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
Step 2: Clone/Setup Project
bash
# Create project directory
mkdir quran-hifz-tracker
cd quran-hifz-tracker

# Initialize project (if starting fresh)
npm init -y
Step 3: Install Dependencies
bash
npm install express mongoose cors
npm install --save-dev nodemon
Step 4: Create File Structure
bash
# Create necessary directories
mkdir public

# Move your HTML files to public folder
mv index.html teacher.html student.html public/
Step 5: Update package.json
Replace your package.json with the provided one, or add these scripts:

json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
Step 6: Start the Application
bash
# Start the server
npm start

# OR for development (auto-restart on changes)
npm run dev
The application will be available at: http://localhost:3000

Step 7: Seed Sample Data (Optional)
To populate the database with sample data for testing:

bash
# Option 1: Via API call (when server is running)
curl -X POST http://localhost:3000/api/seed

# Option 2: Visit in browser
http://localhost:3000/api/seed
📡 API Endpoints
Halaqas (Study Circles)
Method	Endpoint	Description
GET	/api/halaqas	Get all Halaqas
GET	/api/halaqas/:id	Get single Halaqa
POST	/api/halaqas	Create new Halaqa
PUT	/api/halaqas/:id	Update Halaqa
DELETE	/api/halaqas/:id	Delete Halaqa
Students
Method	Endpoint	Description
GET	/api/students	Get all students
GET	/api/students?halaqaId=:id	Get students by Halaqa
GET	/api/students/:id	Get single student
POST	/api/students	Create new student
PUT	/api/students/:id	Update student
DELETE	/api/students/:id	Delete student
Statistics
Method	Endpoint	Description
GET	/api/statistics	Get dashboard statistics
Utility
Method	Endpoint	Description
POST	/api/seed	Seed database with sample data
🎯 Usage Guide
For Teachers:
Access Teacher Dashboard: Click "معلم" (Teacher) on the home page
Add Halaqa: Enter a name for your study circle
Add Students: Fill in student details (name, age, Halaqa, progress)
Track Progress: View all students with their progress bars
Edit/Delete: Click buttons on student cards to modify data
Filter: Use the dropdown to filter students by Halaqa
For Students:
Access Student Dashboard: Click "طالب" (Student) on the home page
Select Your Profile: Choose your name from the dropdown
View Progress: See your memorization progress in various formats
Track Juz: Check which Juz you've completed on the grid
Earn Badges: Achievement badges appear as you progress
🎨 Customization
Changing Colors
Edit the CSS in the HTML files or create a custom styles.css:

css
/* Main brand color */
--primary-color: #008080;
--secondary-color: #20c997;

/* Gradients */
background: linear-gradient(135deg, #667eea, #764ba2);
Adding More Features
The modular structure allows easy additions:

Add reports/charts using Chart.js
Implement user authentication
Add email notifications
Create printable certificates
🔧 Troubleshooting
MongoDB Connection Error
bash
# Check if MongoDB is running
# macOS/Linux:
brew services list
# or
sudo systemctl status mongod

# Windows: Check Services app
Port Already in Use
Change the port in server.js:

javascript
const PORT = process.env.PORT || 3001; // Changed from 3000
CORS Issues
The server includes CORS middleware. If issues persist:

javascript
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
📊 Database Schema
Halaqa Model
javascript
{
  name: String,
  students: [ObjectId] // References to Student
}
Student Model
javascript
{
  name: String,
  age: Number,
  progress: Number,      // 0-30 (Juz completed)
  khatmDate: String,     // Expected completion date
  halaqa: ObjectId       // Reference to Halaqa
}
🚀 Deployment
Deploy to Heroku
bash
# Install Heroku CLI, then:
heroku create your-app-name
heroku addons:create mongolab
git push heroku main
Deploy to Railway/Render
Connect your GitHub repository
Add MongoDB connection string as environment variable
Deploy automatically
Environment Variables
For production, use environment variables:

javascript
// server.js
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/quran-hifz";
📝 License
MIT License - feel free to use this project for educational purposes.

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

📧 Support
For issues or questions, please open an issue on the GitHub repository.

Made with ❤️ for the Quran memorization community

الله يبارك فيكم ويجعل هذا العمل في ميزان حسناتكم

