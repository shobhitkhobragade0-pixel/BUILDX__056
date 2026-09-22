import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/database.js';
import { createEmergencyRouter } from './routes/emergency.js';
import { createHospitalsRouter } from './routes/hospitals.js';
import { createAmbulancesRouter } from './routes/ambulances.js';
import { createBloodBanksRouter } from './routes/bloodBanks.js';
import { createDemoRouter } from './routes/demo.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend Vite dev server (port 5173 / any origin)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize Realtime Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join', (room: string) => {
    socket.join(room);
    console.log(`[Socket.IO] Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'LIFELINK NAGPUR Emergency Coordination Network',
    timestamp: new Date().toISOString(),
    databases: db.getHealth(),
    disclaimer: 'For immediate life-threatening emergencies, contact official emergency services (108 / 112).'
  });
});

// Mount Routes
app.use('/api/emergency', createEmergencyRouter(io));
app.use('/api/hospitals', createHospitalsRouter(io));
app.use('/api/ambulances', createAmbulancesRouter(io));
app.use('/api/blood-banks', createBloodBanksRouter(io));
app.use('/api/demo/rohan', createDemoRouter(io));

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  await db.initialize();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  LIFELINK NAGPUR Backend Server Running`);
    console.log(`  PORT: ${PORT}`);
    console.log(`  API Health: http://localhost:${PORT}/api/health`);
    console.log(`  Tagline: Right Hospital. Right Resources. Right Now.`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error in LIFELINK server:', err);
});
