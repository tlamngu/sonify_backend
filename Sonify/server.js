import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; 
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import musicRoutes from './routes/musicsRouter.js';
import userRoutes from "./routes/userRoutes.js"
import featuresRoutes from "./routes/featuresRoute.js"
import errorHandler from './middlewares/errorHandler.js';
import { sendError } from './utils/responseUtils.js';
import genreRoutes from './routes/genreRoutes.js';
import albumRoutes from './routes/albumRoutes.js';
import userLibraryRoutes from './routes/userLibraryRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';

dotenv.config();

connectDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_V1_BASE = '/api/v1';

app.use(cors());
app.use(express.json());

app.use(`${API_V1_BASE}/auth`, authRoutes);
app.use(`${API_V1_BASE}/users`, userRoutes);
app.use(`${API_V1_BASE}/music`, musicRoutes); 
app.use(`${API_V1_BASE}/features`, featuresRoutes); 

app.use(`${API_V1_BASE}/genres`, genreRoutes);
app.use(`${API_V1_BASE}/albums`, albumRoutes);
app.use(`${API_V1_BASE}/library`, userLibraryRoutes);
app.use(`${API_V1_BASE}/recommendations`, recommendationRoutes);


app.get('/', (req, res) => {
    res.send('Sonify API is alive ^-^ 🪄🥳');
});

const debugUiPath = path.join(__dirname, 'temp', 'Debug_UI');
app.use('/debug/ui', express.static(debugUiPath));
app.get('/debug/ui', (req, res) => {
    res.sendFile(path.join(debugUiPath, 'music_test.html'));
});





app.use((req, res, next) => {
    if (!res.headersSent && !req.url.startsWith('/debug/ui/')) {
       sendError(res, 404, `Resource not found at ${req.originalUrl}`);
    } else {
       next();
    }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
    console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    )
);

// process.on('unhandledRejection', (err, promise) => {
//     console.error(`Unhandled Rejection: ${err.message}`);
//     server.close(() => process.exit(1));
// });