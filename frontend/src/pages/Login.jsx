import "./Login.css";

import {
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
} from "firebase/auth";

import { useEffect } from "react";

import { auth } from "../firebase";

import { useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    useEffect(() => {

        const unsubscribe =
            onAuthStateChanged(
                auth,
                (currentUser) => {

                    if (currentUser) {

                        navigate("/chat", {

                            state: {
                                user: {

                                    uid:
                                        currentUser.uid,

                                    name:
                                        currentUser.displayName,

                                    email:
                                        currentUser.email,
                                },
                            },
                        });
                    }
                }
            );

        return () => unsubscribe();

    }, []);

    const googleLogin = async () => {

        try {

            const provider =
                new GoogleAuthProvider();

            const result =
                await signInWithPopup(
                    auth,
                    provider
                );

            navigate("/chat", {

                state: {
                    user: {

                        uid:
                            result.user.uid,

                        name:
                            result.user.displayName,

                        email:
                            result.user.email,
                    },
                },
            });

        } catch (error) {

            console.log(error);
        }
    };

    return (

        <div className="login-page">

            <div className="login-container">

                <div className="left-panel">

                    <h1>

                        AgroBot
                        <span> AI</span>

                    </h1>

                    <p>

                        Your AI assistant for smart farming,
                        crop disease detection, weather
                        insights, and market prices.

                    </p>

                    <div className="feature-grid">

                        <div className="feature-card">

                            <h3>🌦 Weather</h3>

                            <p>
                                Live farming weather updates
                            </p>

                        </div>

                        <div className="feature-card">

                            <h3>📈 Market</h3>

                            <p>
                                Crop market price tracking
                            </p>

                        </div>

                        <div className="feature-card">

                            <h3>🌱 Disease AI</h3>

                            <p>
                                Detect crop diseases instantly
                            </p>

                        </div>

                        <div className="feature-card">

                            <h3>🎤 Voice AI</h3>

                            <p>
                                Smart voice assistant support
                            </p>

                        </div>

                    </div>

                </div>

                <div className="login-card">

                    <div className="floating-glow"></div>

                    <img
    src="https://cdn-icons-png.flaticon.com/512/628/628324.png"
                        alt="logo"
                        className="logo"
                    />

                    <h2>

                        Welcome Back
                        <span> 🌾</span>

                    </h2>

                    <p>

                        Sign in to continue using
                        AgroBot AI

                    </p>

                    <button
                        className="google-btn"
                        onClick={googleLogin}
                    >

                        <img
                            src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
                            alt="google"
                        />

                        Sign in with Google

                    </button>

                    <div className="bottom-features">

                        <div className="bottom-item">

                            <span>🔒</span>

                            <div>

                                <h4>
                                    Secure Login
                                </h4>

                                <p>
                                    Protected with Firebase
                                    Authentication
                                </p>

                            </div>

                        </div>

                        <div className="bottom-item">

                            <span>⚡</span>

                            <div>

                                <h4>
                                    AI Powered
                                </h4>

                                <p>
                                    Smart farming assistant
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                <div className="right-panel">

                    <div className="info-box">

                        <h3>
                            🌦 Weather Intelligence
                        </h3>

                        <p>

                            Real-time weather updates
                            for better farming decisions.

                        </p>

                    </div>

                    <div className="info-box">

                        <h3>
                            📈 Market Insights
                        </h3>

                        <p>

                            Stay updated with latest
                            crop prices and trends.

                        </p>

                    </div>

                    <div className="info-box">

                        <h3>
                            🌱 Crop Health AI
                        </h3>

                        <p>

                            Upload crop images and
                            get instant disease analysis.

                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;