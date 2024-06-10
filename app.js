
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const port = 3000;
const url = 'mongodb://127.0.0.1:27017/clg'; // MongoDB connection URL with database name
let db;
let collection;

// Middleware to check for DB connection
const connectToDB = async (req, res, next) => {
  if (!db || !collection) {
    try {
      const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
      db = client.db(); // No need to specify the database name again since it's included in the URL
      collection = db.collection('students'); // Create or get the collection
      console.log('Connected to database "college" and collection "students"');
    } catch (err) {
      console.error('Failed to connect to the database', err);
      res.status(500).send('Database connection failed');
      return;
    }
  }
  req.db = db;
  req.collection = collection;
  next();
};

app.use(express.urlencoded({ extended: true })); // Built-in body parser middleware
app.use(express.static(path.join(__dirname, 'views'))); // Serve static files from the 'views' directory

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route to serve the insert page
app.get('/insert', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'insert.html'));
});

// Handle form submission for insert
app.post('/insert', connectToDB, async (req, res) => {
  try {
    const newItem = { name: req.body.name, value: req.body.value };
    await req.collection.insertOne(newItem);
    res.redirect('/');
  } catch (err) {
    console.error('Insert operation failed', err);
    res.status(500).send('Failed to insert item');
  }
});

// Route to serve the update page
app.get('/update', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'update.html'));
});

// Handle form submission for update
app.post('/update', connectToDB, async (req, res) => {
  try {
    const { id, name, value } = req.body;
    await req.collection.updateOne({ _id: new ObjectId(id) }, { $set: { name, value } });
    res.redirect('/');
  } catch (err) {
    console.error('Update operation failed', err);
    res.status(500).send('Failed to update item');
  }
});

// Route to serve the delete page
app.get('/delete', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'delete.html'));
});

// Handle form submission for delete
app.post('/delete', connectToDB, async (req, res) => {
  try {
    const id = req.body.id;
    await req.collection.deleteOne({ _id: new ObjectId(id) });
    res.redirect('/');
  } catch (err) {
    console.error('Delete operation failed', err);
    res.status(500).send('Failed to delete item');
  }
});

// Route to serve the display page
app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'display.html'));
});

// API endpoint to fetch display data
app.get('/api/display-data', connectToDB, async (req, res) => {
  try {
    const items = await req.collection.find().toArray();
    res.json(items);
  } catch (err) {
    console.error('Display operation failed', err);
    res.status(500).send('Failed to fetch items');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
});