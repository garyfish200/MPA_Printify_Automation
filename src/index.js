const express = require('express');
const dotenv = require('dotenv');
const printifyRoutes = require('./routes/printifyRoutes');

dotenv.config();

// console.log('Environment variables:', process.env);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/printify', printifyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
