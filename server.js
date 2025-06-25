// const express = require('express');
// const bodyParser = require('body-parser');
// const path = require('path');
// require('dotenv').config();
// const connectDB = require('./config/db');
// const api = require('./routes/app');
// const cors=require('cors')
// const app = express(); // ✅ Initialize app first
// const PORT = process.env.PORT || 3000;

// // Connect to MongoDB
// connectDB();
// app.use(cors({
//     origin: 'http://localhost:4200', // or use '*' for any origin (not recommended in production)
//     credentials: true
//   }));
// // Middleware
// app.use(bodyParser.json());
// app.use(express.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // static image access

// // Routes
// app.use('/', api);

// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
// });
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.json({ status: 'success', message: 'Minimal test working!' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
