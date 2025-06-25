const express = require('express');
const router = express.Router();
const {Bill,Items,User} = require('../models/crackers_schema');
const upload = require('../middleware/uploads');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const sendOrderNotification = require('../services/twilioService');
const JWT_SECRET = 'jprSecret2024'; // Use env in production

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: '2h',
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ CREATE NEW USER (for testing only, use POST+auth in production)
router.get('/newUser/:username/:password', async (req, res) => {
  try {
    const { username, password } = req.params;

    // Check if user already exists
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});
router.get('/items', async (req, res) => {
    try {
        const allItems = await Items.find({});
        res.status(200).json(allItems);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});
router.post('/items/bulk-insert', async (req, res) => {
    try {
        const rawItems = req.body.items;

        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            return res.status(400).json({ error: "No items provided for insertion" });
        }

        const formattedItems = rawItems.map(item => ({
            item_number: item.itemNumber,
            cracker_name: item.name,
            cracker_price: item.discountPrice,
            available: true,
            cracker_type: item.crackerType,
            imageUrl: "" // Set as empty string
        }));

        const inserted = await Items.insertMany(formattedItems);
        res.status(201).json({ message: 'Items inserted successfully', data: inserted });
    } catch (err) {
        console.error('Error inserting items:', err);
        res.status(500).json({ error: 'Failed to insert items' });
    }
});
router.put('/items/:id', async (req, res) => {
    try {
      const updated = await Items.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ error: 'Item not found' });
      res.status(200).json(updated);
    } catch (err) {
      console.error('Update failed:', err);
      res.status(500).json({ error: 'Failed to update item' });
    }
  });
  
  router.post('/items', async (req, res) => {
    try {
      // 🔍 Get the current max item_number
      const latestItem = await Items.findOne().sort({ item_number: -1 }).exec();
      const nextItemNumber = latestItem ? latestItem.item_number + 1 : 1;
  
      // ✅ Create new item with auto-incremented item_number
      const newCracker = new Items({
        item_number: nextItemNumber,
        cracker_name: req.body.cracker_name,
        cracker_price: req.body.cracker_price,
        cracker_type: req.body.cracker_type,
        available: req.body.available,
        imageUrl: req.body.imageUrl || ''
      });
  
      const saved = await newCracker.save();
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error creating cracker:', error);
      res.status(500).json({ error: 'Failed to create cracker' });
    }
  });
  
  router.delete('/items/:id', async (req, res) => {
    try {
      const deletedItem = await Items.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.status(200).json({ message: 'Item deleted successfully', data: deletedItem });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });
  router.post('/items/upload/:id', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }
  
      const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
      const updated = await Items.findByIdAndUpdate(
        req.params.id,
        { imageUrl },
        { new: true }
      );
  
      if (!updated) {
        return res.status(404).json({ error: 'Item not found' });
      }
  
      res.status(200).json(updated);
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });
  router.get('/bill', async (req, res) => {
    try {
      const bills = await Bill.find().sort({ createdAt: -1 }); // Latest first
      res.status(200).json(bills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      res.status(500).json({ error: 'Failed to fetch bills' });
    }
  });

router.post('/bill', async (req, res) => {
  try {
    const { customerInfo, items, totalAmount } = req.body;

    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Incomplete order data' });
    }

    const newBill = new Bill({ customerInfo, items, totalAmount });
    const savedBill = await newBill.save();

    // ✅ Return orderId
    res.status(201).json({ 
      message: 'Order placed successfully', 
      orderId: savedBill.orderId, // Include this for frontend
      data: savedBill 
    });
  } catch (error) {
    console.error('Error saving bill:', error);
    res.status(500).json({ error: 'Failed to save bill' });
  }
});
router.get('/dashboard/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start

    // Count orders today
    const ordersToday = await Bill.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // Count orders this week
    const ordersThisWeek = await Bill.countDocuments({
      createdAt: { $gte: startOfWeek }
    });

    res.status(200).json({ ordersToday, ordersThisWeek });
  } catch (err) {
    console.error('Error in dashboard summary:', err);
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});
router.get('/dashboard/orders-per-day', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const dailyOrders = await Bill.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    const daysInMonth = endOfMonth.getDate();
    const ordersArray = Array(daysInMonth).fill(0);

    dailyOrders.forEach(item => {
      ordersArray[item._id - 1] = item.count;
    });

    res.status(200).json({ days: ordersArray });
  } catch (err) {
    console.error('Error fetching daily orders:', err);
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
});
router.get('/dashboard/orders-by-crackertype', async (req, res) => {
  try {
    const result = await Bill.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'items',
          localField: 'items.name',
          foreignField: 'cracker_name',
          as: 'itemInfo'
        }
      },
      { $unwind: '$itemInfo' },
      {
        $group: {
          _id: '$itemInfo.cracker_type',
          totalOrdered: { $sum: '$items.quantity' }
        }
      }
    ]);

    const chartData = result.map(entry => ({
      name: entry._id,
      y: entry.totalOrdered
    }));

    res.status(200).json(chartData);
  } catch (err) {
    console.error('Error aggregating cracker type orders:', err);
    res.status(500).json({ error: 'Failed to aggregate cracker types' });
  }
});

  

module.exports = router;
