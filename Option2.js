// item.js
const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const PORT = 3005;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Setup Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './inventory.sqlite',
});

// Define Item model
const Item = sequelize.define('Item', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Sync DB
sequelize.sync().then(() => {
  console.log('✅ Database synced.');
});

// Serve item.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'item.html'));
});

// API: Get all items
app.get('/items', async (req, res) => {
  const items = await Item.findAll();
  res.json(items);
});

// API: Create item
app.post('/items', async (req, res) => {
  const { name, quantity, category } = req.body;
  try {
    const item = await Item.create({ name, quantity, category });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API: Update name/category
app.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;
  try {
    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.name = name || item.name;
    item.category = category || item.category;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API: Change quantity
app.patch('/items/:id/quantity', async (req, res) => {
  const { id } = req.params;
  const { change } = req.body;
  try {
    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.quantity += change;
    if (item.quantity < 0) item.quantity = 0;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API: Delete item
app.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await item.destroy();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
