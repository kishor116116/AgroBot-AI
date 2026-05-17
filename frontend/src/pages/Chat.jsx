





import "../App.css";

import {
    useState,
    useEffect,
    useRef,
} from "react";

import axios from "axios";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import { auth } from "../firebase";

import {
    signOut,
} from "firebase/auth";

import ReactMarkdown from "react-markdown";

import {
    FaVolumeUp,
    FaArrowDown,
    FaMicrophone,
    FaPlus,
    FaCopy,

} from "react-icons/fa";

// import Particles from "react-tsparticles";

// import { loadFull } from "tsparticles";

function Chat() {

    const location = useLocation();

    const navigate = useNavigate();

    const user = location.state?.user;

    const [messages, setMessages] = useState([]);

    const [input, setInput] = useState("");

    const [loading, setLoading] = useState(false);

    const [image, setImage] = useState(null);

    const [history, setHistory] = useState([]);

    const [currentConversation, setCurrentConversation] = useState(null);

    const [language, setLanguage] = useState("English");

    const [showSidebar, setShowSidebar] = useState(true);

    const messagesEndRef = useRef(null);

    const [copied, setCopied] =
        useState(false);

    useEffect(() => {

        if (!user) {
            navigate("/");
        }

    }, []);

    useEffect(() => {

        if (user) {
            fetchHistory(user);
        }

    }, []);

    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });

    }, [messages]);



    const speakMessage = (text) => {

        const speech =
            new SpeechSynthesisUtterance(text);

        speech.lang = "en-IN";

        speech.rate = 1;

        speech.pitch = 1;

        window.speechSynthesis.speak(speech);
    };



    const startListening = () => {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            alert("Speech Recognition not supported");

            return;
        }

        const recognition =
            new SpeechRecognition();

        recognition.lang = "en-US";

        recognition.start();

        recognition.onresult = (event) => {

            const transcript =
                event.results[0][0].transcript;

            setInput(transcript);
        };
    };

    const fetchHistory = async (currentUser) => {

        try {

            const response = await axios.get(
                `http://localhost:5000/conversations/${currentUser.uid}`
            );

            setHistory(response.data);

        } catch (error) {
            console.log(error);
        }
    };

    const createNewConversation = () => {

        setCurrentConversation(null);

        setMessages([]);

        localStorage.removeItem(
            "currentConversationId"
        );
    };

    const getWeather = async (city) => {

        try {

            const response =
                await axios.get(

                    `http://localhost:5000/weather/${city}`

                );

            const data =
                response.data;

            const weatherMessage = {

                sender: "bot",

                text:
                    `🌦 Weather in ${data.city}

🌡 Temperature: ${data.temperature}°C

💧 Humidity: ${data.humidity}%

☁ Condition: ${data.condition}

🌬 Wind Speed: ${data.wind} km/h`,
            };

            setMessages((prev) => [
                ...prev,
                weatherMessage,
            ]);
            speakText(weatherMessage.text);
            await axios.post(
                "http://localhost:5000/save-message",
                {

                    conversationId:
                        currentConversation?._id,

                    userMessage:
                        "weather",

                    botReply:
                        weatherMessage.text,
                }
            );

        } catch (error) {

            console.log(error);
        }
    };

    const getMarketPrices = async () => {

        try {

            const response =
                await axios.get(

                    "http://localhost:5000/market-prices"

                );

            const data =
                response.data;

            let message =
                "📈 Today's Market Prices\n\n";

            data.forEach((item) => {

                message +=
                    `🌾 ${item.crop}: ${item.price}\n`;
            });

            setMessages((prev) => [

                ...prev,

                {
                    sender: "bot",

                    text: message,
                },
            ]);



            await axios.post(
                "http://localhost:5000/save-message",
                {

                    conversationId:
                        currentConversation?._id,

                    userMessage:
                        "market price",

                    botReply:
                        message,
                }
            );
            speakText(message);

        } catch (error) {

            console.log(error);
        }
    };

    const speakText = (text) => {

        const speech =
            new SpeechSynthesisUtterance(text);

        speech.lang = "en-US";

        speech.rate = 1;

        speech.pitch = 1;

        window.speechSynthesis.speak(
            speech
        );
    };

    const stopSpeaking = () => {

        window.speechSynthesis.cancel();
    };

    const streamText = async (
        fullText
    ) => {

        let currentText = "";

        const tempMessage = {

            sender: "bot",

            text: "",
        };

        setMessages((prev) => [
            ...prev,
            tempMessage,
        ]);

        for (
            let i = 0;
            i < fullText.length;
            i++
        ) {

            currentText += fullText[i];

            await new Promise(
                (resolve) =>
                    setTimeout(resolve, 15)
            );

            setMessages((prev) => {

                const updated = [...prev];

                updated[
                    updated.length - 1
                ] = {

                    sender: "bot",

                    text: currentText,
                };

                return updated;
            });
        }
    };

    const copyMessage = (text) => {

        navigator.clipboard.writeText(
            text
        );

        setCopied(true);

        setTimeout(() => {

            setCopied(false);

        }, 2000);
    };

    const sendMessage = async () => {

        if (input.trim() === "") return;

        const userMessage = {
            text: input,
            sender: "user",
        };

        setMessages((prev) => [
            ...prev,
            userMessage,
        ]);

        const currentInput = input;

        setInput("");

        try {

            setLoading(true);

            if (
                currentInput
                    .toLowerCase()
                    .includes("weather")
            ) {

                getWeather("Bangalore");
                fetchHistory(user);
                setLoading(false);

                return;
            }

            if (
                currentInput
                    .toLowerCase()
                    .includes("price")
            ) {

                getMarketPrices();
                fetchHistory(user);

                setLoading(false);

                return;
            }

            let activeConversation =
                currentConversation;

            if (!activeConversation) {

                const newConversation =
                    await axios.post(
                        "http://localhost:5000/new-conversation",
                        {
                            userId: user?.uid,
                        }
                    );

                activeConversation =
                    newConversation.data;

                setCurrentConversation(
                    activeConversation
                );
            }

            const response = await axios.post(
                "http://localhost:5000/chat",
                {
                    message: currentInput,
                    language,
                    userId: user?.uid,
                    conversationId:
                        activeConversation?._id,
                }
            );

            await streamText(
                response.data.reply
            );
            speakText(response.data.reply);



            fetchHistory(user);

            setLoading(false);

        } catch (error) {

            console.log(error);

            setLoading(false);
        }
    };

    const uploadImage = async () => {

        if (!image || !input) return;

        const formData = new FormData();

        formData.append("image", image);

        formData.append("prompt", input);

        formData.append("language", language);

        formData.append("userId", user?.uid);
        formData.append(
            "conversationId",
            currentConversation?._id
        );

        try {

            setLoading(true);

            const response = await axios.post(
                "http://localhost:5000/analyze-image",
                formData
            );

            const userImageMessage = {
                image: URL.createObjectURL(image),
                text: input,
                sender: "user",
            };

            const botMessage = {
                text: response.data.reply,
                sender: "bot",
            };

            setMessages((prev) => [
                ...prev,
                userImageMessage,
                botMessage,
            ]);

            setInput("");

            setImage(null);

            setLoading(false);

        } catch (error) {

            console.log(error);

            setLoading(false);
        }
    };

    const loadConversation = (conversation) => {

        setCurrentConversation(conversation);

        const loadedMessages = [];

        conversation.messages.forEach((msg) => {

            loadedMessages.push({
                text: msg.content,
                sender:
                    msg.role === "user"
                        ? "user"
                        : "bot",
            });
        });

        setMessages(loadedMessages);
    };

    const logout = async () => {

        try {

            await signOut(auth);

            navigate("/");

        } catch (error) {
            console.log(error);
        }
    };

    return (

        <>



            <div className="main-layout">

                {copied && (

                    <div className="copy-toast">

                        ✅ Copied

                    </div>
                )}

                <div
                    className={
                        showSidebar
                            ? "sidebar"
                            : "sidebar sidebar-hidden"
                    }
                >

                    <h2>🌾 AgroBot AI</h2>

                    <button onClick={createNewConversation}>
                        + New Chat
                    </button>

                    <h3>Chat History</h3>

                    {history.map((conversation, index) => (

                        <div
                            key={index}
                            className={
                                currentConversation?._id ===
                                    conversation._id
                                    ? "history-item active"
                                    : "history-item"
                            }
                            onClick={() =>
                                loadConversation(conversation)
                            }
                        >
                            <p>{conversation.title}</p>
                        </div>
                    ))}
                </div>

                <div className="chat-section">

                    <div className="top-bar">

                        <button
                            className="menu-btn"
                            onClick={() =>
                                setShowSidebar(!showSidebar)
                            }
                        >
                            ☰
                        </button>
                        <div className="ai-status">

                            <span className="status-dot"></span>

                            AgroBot AI Online

                        </div>

                        <select
                            value={language}
                            onChange={(e) =>
                                setLanguage(e.target.value)
                            }
                        >
                            <option>English</option>
                            <option>Kannada</option>
                            <option>Telugu</option>
                            <option>Hindi</option>
                        </select>

                        <button
                            className="logout-btn"
                            onClick={logout}
                        >
                            Logout
                        </button>
                    </div>

                    <div className="chat-container">

                        {messages.length === 0 && (

                            <div className="empty-chat">

                                <h1>🌾 AgroBot AI</h1>

                                <p>
                                    Ask anything about farming,
                                    crops, weather, fertilizer,
                                    or market prices.
                                </p>
                            </div>
                        )}

                        {messages.map((msg, index) => (

                            <div
                                key={index}
                                className={
                                    msg.sender === "bot"
                                        ? "message-row bot-row"
                                        : "message-row user-row"
                                }
                            >

                                {msg.sender === "bot" && (
                                    <div className="bot-avatar">
                                        🤖
                                    </div>
                                )}

                                <div
                                    className={
                                        msg.sender === "bot"
                                            ? "bot-message"
                                            : "user-message"
                                    }
                                >

                                    {msg.text && (
                                        <ReactMarkdown>
                                            {msg.text}
                                        </ReactMarkdown>
                                    )}

                                    {msg.image && (
                                        <img
                                            src={msg.image}
                                            alt="uploaded"
                                            width="200"
                                            style={{
                                                borderRadius: "10px",
                                                marginTop: "10px",
                                            }}
                                        />
                                    )}

                                    <div className="message-actions">

                                        {msg.sender === "bot" && (
                                            <>
                                                <button
                                                    className="speak-btn"
                                                    onClick={() =>
                                                        speakMessage(msg.text)
                                                    }
                                                >
                                                    <FaVolumeUp />
                                                </button>

                                                <button
                                                    className="stop-btn"
                                                    onClick={stopSpeaking}
                                                >
                                                    🔇
                                                </button>

                                                <button
                                                    className="copy-btn"
                                                    onClick={() =>
                                                        copyMessage(msg.text)
                                                    }
                                                >
                                                    <FaCopy />
                                                </button>


                                            </>

                                        )}


                                        <div className="message-time">
                                            {new Date().toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (

                            <div className="message-row bot-row">

                                <div className="bot-avatar">
                                    🤖
                                </div>

                                <div className="bot-message typing-box">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef}></div>
                    </div>

                    <button
                        className="floating-btn"
                        onClick={() =>
                            messagesEndRef.current?.scrollIntoView({
                                behavior: "smooth",
                            })
                        }
                    >
                        <FaArrowDown />
                    </button>

                    <div className="input-area">

                        <label className="icon-btn">
                            <FaPlus />

                            <input
                                type="file"
                                hidden
                                onChange={(e) =>
                                    setImage(e.target.files[0])
                                }
                            />
                        </label>

                        <button
                            className="icon-btn"
                            onClick={startListening}
                        >
                            <FaMicrophone />
                        </button>


                        <div className="input-wrapper">

                            {image && (
                                <img
                                    src={URL.createObjectURL(image)}
                                    alt="preview"
                                    className="preview-image"
                                />
                            )}

                            <textarea
                                placeholder="Ask something..."
                                value={input}
                                onChange={(e) =>
                                    setInput(e.target.value)
                                }
                                onKeyUp={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        !e.shiftKey
                                    ) {
                                        e.preventDefault();

                                        if (image) {
                                            uploadImage();
                                        } else {
                                            sendMessage();
                                        }
                                    }
                                }}
                                rows="1"
                                className="chat-input"
                            />
                        </div>

                        <button
                            className="send-btn"
                            onClick={
                                image
                                    ? uploadImage
                                    : sendMessage
                            }
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Chat;

