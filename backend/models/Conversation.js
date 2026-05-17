const mongoose = require("mongoose");

const conversationSchema =
  new mongoose.Schema({
    userId: String,

    title: String,

    messages: [
      {
        role: String,

        content: String,
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);