const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const Chat = require("./models/Chat");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Conversation = require(
    "./models/Conversation"
);


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {
        cb(
            null,
            Date.now() + "-" + file.originalname
        );
    },
});

const upload = multer({ storage: storage });

mongoose
    .connect(process.env.MONGO_URI, {
        tls: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));

const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;
        const language = req.body.language;

        const userId = req.body.userId;
        const conversationId =
            req.body.conversationId;

        console.log("Message received");
        console.log(userMessage);
        const conversation =
            await Conversation.findById(
                conversationId
            );

        const history =
            conversation.messages;
        const completion =
            await client.chat.completions.create({
                model: "deepseek/deepseek-chat",
                messages: [
                    ...history,
                    {
                        role: "user",
                        content: `
You are AgroBot AI,
a friendly smart farming assistant.

Reply in ${language}.

Keep responses:
- natural
- conversational
- short
- human-like

Use markdown formatting when useful.

Avoid robotic formatting unless needed.

User message:
${userMessage}
`,
                    },
                ],
            });

        const reply =
            completion.choices[0].message.content;
        if (
            conversation.title ===
            "New Chat"
        ) {
            conversation.title =
                userMessage.slice(0, 30);
        }
        conversation.messages.push({
            role: "user",
            content: userMessage,
        });

        conversation.messages.push({
            role: "assistant",
            content: reply,
        });

        await conversation.save();
        res.json({
            reply,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            reply: "Something went wrong",
        });
    }
});

app.get("/market-prices", async (req, res) => {

    try {

        const prices = [

            {
                crop: "Tomato",
                price: "₹22/kg",
            },

            {
                crop: "Cauliflower",
                price: "₹34/kg",
            },

            {
                crop: "Beetroot",
                price: "₹28/kg",
            },
        ];

        res.json(prices);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error:
                "Failed to fetch prices",
        });
    }
});
app.get("/weather/:city", async (req, res) => {

    try {

        const city =
            req.params.city;

        const response =
            await axios.get(

                `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`

            );

        const data =
            response.data;

        res.json({

            city:
                data.location.name,

            temperature:
                data.current.temp_c,

            humidity:
                data.current.humidity,

            condition:
                data.current.condition.text,

            wind:
                data.current.wind_kph,
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error:
                "Weather fetch failed",
        });
    }
});

app.post(
    "/upload",
    upload.single("image"),
    (req, res) => {
        res.json({
            message: "Image uploaded successfully",
            file: req.file.filename,
        });
    }
);

app.post(
    "/analyze-image",
    upload.single("image"),
    async (req, res) => {
        try {
            const prompt = req.body.prompt;
            const language = req.body.language;

            const imagePath = path.join(
                __dirname,
                "uploads",
                req.file.filename
            );

            const imageBase64 =
                fs.readFileSync(imagePath, {
                    encoding: "base64",
                });

            const completion =
                await client.chat.completions.create({
                    model:
                        "meta-llama/llama-3.2-11b-vision-instruct",

                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text:

                                        `
You are AgroBot AI,
a smart farming assistant.

Reply in ${language}.

Analyze the crop image carefully.

Give:

1. Disease name
2. Cause
3. Treatment
4. Fertilizer suggestion
5. Prevention tips

Keep response:
- very short
- simple
- practical
- maximum 6 lines
- easy for farmers


User prompt:
${prompt}
`,
                                },

                                {
                                    type: "image_url",
                                    image_url: {
                                        url:
                                            `data:image/jpeg;base64,${imageBase64}`,
                                    },
                                },
                            ],
                        },
                    ],
                });

            const reply =
                completion.choices[0].message.content;
            const conversationId =
                req.body.conversationId;

            if (conversationId) {

                const conversation =
                    await Conversation.findById(
                        conversationId
                    );

                if (conversation) {

                    conversation.messages.push({

                        role: "user",

                        content:
                            `[Image Uploaded] ${prompt}`,
                    });

                    conversation.messages.push({

                        role: "assistant",

                        content: reply,
                    });

                    await conversation.save();
                }
            }

            res.json({
                reply,
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                reply: "Image analysis failed",
            });
        }
    }
);

app.get("/history/:userId", async (req, res) => {
    try {
        const chats = await Chat.find({
            userId: req.params.userId,
        }).sort({ createdAt: 1 });

        res.json(chats);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Failed to fetch history",
        });
    }
});

app.post(
    "/new-conversation",
    async (req, res) => {
        try {
            const { userId } = req.body;

            const conversation =
                await Conversation.create({
                    userId: userId,

                    title: "New Chat",

                    messages: [],
                });

            res.json(conversation);
        } catch (error) {
            console.log(error);

            res.status(500).json({
                error:
                    "Failed to create conversation",
            });
        }
    }
);

app.post("/save-message", async (req, res) => {

    try {

        const {
            conversationId,
            userMessage,
            botReply,
        } = req.body;

        const conversation =
            await Conversation.findById(
                conversationId
            );

        if (!conversation) {

            return res.status(404).json({
                error:
                    "Conversation not found",
            });
        }

        conversation.messages.push({
            role: "user",
            content: userMessage,
        });

        conversation.messages.push({
            role: "assistant",
            content: botReply,
        });

        if (
            conversation.title ===
            "New Chat"
        ) {

            conversation.title =
                userMessage.slice(0, 30);
        }

        await conversation.save();

        res.json({
            success: true,
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error:
                "Failed to save message",
        });
    }
});

app.get(
    "/conversations/:userId",
    async (req, res) => {
        try {
            const conversations =
                await Conversation.find({
                    userId: req.params.userId,
                }).sort({
                    createdAt: -1,
                });

            res.json(conversations);
        } catch (error) {
            console.log(error);

            res.status(500).json({
                error:
                    "Failed to fetch conversations",
            });
        }
    }
);


app.listen(5000, () => {
    console.log("Server running on port 5000");
});