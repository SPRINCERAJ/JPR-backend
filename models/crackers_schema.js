const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const billSchema = new mongoose.Schema({
  orderId: Number, // this will be auto-incremented
  customerInfo: {
    name: String,
    mobile: String,
    address: String,
    state: String,
    city: String,
  },
  items: [
    {
      name: String,
      quantity: Number,
      total: Number,
    },
  ],
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  username:String,
  password:String,
  createdAt: { type: Date, default: Date.now },
});

// Auto-increment orderId
billSchema.plugin(AutoIncrement, { inc_field: 'orderId' });

// Define Item Schema
const itemSchema = new mongoose.Schema({
    item_number:Number,
    cracker_name: String,
    cracker_price: Number,
    available: Boolean,
    cracker_type:String,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now },
});

// ✅ Export both models correctly
const Bill = mongoose.model('Bill', billSchema);
const Items = mongoose.model('Items', itemSchema);
const User = mongoose.model('User',userSchema)

module.exports = { Bill, Items,User };
