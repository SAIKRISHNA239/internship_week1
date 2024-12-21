// Step 2: Backend Development in Detail

// 1. Import Required Modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Configure Environment Variables
dotenv.config();

// Initialize Express Application
const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests
console.log('Middleware for JSON parsing enabled.');
app.use(cors()); // Enable Cross-Origin Resource Sharing
console.log('CORS middleware enabled.');

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Define a Port
const PORT = process.env.PORT || 5000;

// Basic Route for Testing
app.get('/', (req, res) => {
    console.log('GET / request received.');
    res.send('SyncVision Backend is running');
});

// Step 2.1: API Endpoints

// Task Schema and Routes
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    assignedTo: String,
    dueDate: { type: Date, required: true },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// Task Routes
app.get('/tasks', async (req, res) => {
    console.log('GET /tasks request received.');
    try {
        const tasks = await Task.find();
        console.log('Fetched tasks:', tasks);
        res.json(tasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: 'Error fetching tasks' });
    }
});

app.post('/tasks', async (req, res) => {
    console.log('POST /tasks request received with body:', req.body);
    try {
        if (!req.body.title || !req.body.description || !req.body.dueDate) {
            return res.status(400).json({ error: 'Title, description, and dueDate are required.' });
        }
        const newTask = new Task(req.body);
        const savedTask = await newTask.save();
        console.log('Task created successfully:', savedTask);
        res.json(savedTask);
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ error: 'Error creating task' });
    }
});

// Step 2.2: Real-Time Communication with Socket.io
const http = require('http');
const { Server } = require('socket.io');

// Create HTTP Server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for a custom event
    socket.on('task_updated', (data) => {
        console.log('Received task_updated event with data:', data);
        io.emit('update_task_list', data); // Broadcast to all connected clients
        console.log('Broadcasted update_task_list event with data:', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Start the Server
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
