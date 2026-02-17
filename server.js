const express = require('express');
const app = express();
const port = 3000;

// Import your local data with error handling
let products, creator;
try {
    ({ products, creator } = require('./lib/localdata')); // Adjust this path if necessary
    if (!products || !creator) {
        throw new Error("Required data not found in localdata.js");
    }
} catch (error) {
    console.error(`Error loading data: ${error.message}`);
    process.exit(1); // Stop the server if data cannot be loaded
}

// Define routes to serve your data
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/creators', (req, res) => {
  res.json(creator);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.use((req, res, next) => {
  console.log(`${req.method} request for '${req.url}'`);
  next();
});
