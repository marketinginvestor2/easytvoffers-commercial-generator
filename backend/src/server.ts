
import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { google } from 'googleapis';
import { ENV } from './utils/env.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Attach sheets instance for internal route use
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
app.locals.sheets = google.sheets({ version: 'v4', auth });

app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
