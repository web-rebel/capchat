const express = require('express');
const connectDb = require('./config/db');
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDb();

// Get test
app.get('/', (req, res) => res.send('API Running.'));

// Define routes
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/auth', require('./routes/api/auth'));


app.listen(PORT, console.log(`Connected on port ${PORT}`));