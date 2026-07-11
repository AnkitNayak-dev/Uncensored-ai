"use client";
import { useState, useRef, useEffect } from "react";
import { IoIosSend } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { GridScan } from "./GridScan";
import { HeroHighlight, Highlight } from "./hero-highlight";
import { FaLinkedin, FaTwitter, FaGithub } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { HoverBorderGradient } from "./hover-border-gradient";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Turnstile } from '@marsidev/react-turnstile';

// ─── Font size map ───
const FONT_SIZES = { small: "13px", medium: "15px", large: "17px" };

// ─── Typing speed map (chars per tick) ───
const TYPING_SPEEDS = { slow: 1, normal: 3, fast: 8 };

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [allUserInputs, setAllUserInputs] = useState("");
  const [userId, setUserId] = useState(null);
  const [isResponding, setIsResponding] = useState(false);
  const [scanPhase, setScanPhase] = useState("idle");
  const [turnstileToken, setTurnstileToken] = useState("");

  // ─── Settings state ───
  const [showSettings, setShowSettings] = useState(false);
  const [streaming, setStreaming] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [fontSize, setFontSize] = useState("medium");
  const [typingSpeed, setTypingSpeed] = useState("normal");

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedUserId = localStorage.getItem("userId");
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem("userId", storedUserId);
      }
      setUserId(storedUserId);

      // Load saved settings
      const saved = localStorage.getItem("gptoss_settings");
      if (saved) {
        try {
          const s = JSON.parse(saved);
          if (s.streaming !== undefined) setStreaming(s.streaming);
          if (s.animationsEnabled !== undefined) setAnimationsEnabled(s.animationsEnabled);
          if (s.fontSize) setFontSize(s.fontSize);
          if (s.typingSpeed) setTypingSpeed(s.typingSpeed);
        } catch { }
      }
    }
  }, []);

  // Persist settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "gptoss_settings",
        JSON.stringify({ streaming, animationsEnabled, fontSize, typingSpeed })
      );
    }
  }, [streaming, animationsEnabled, fontSize, typingSpeed]);

  const fetchResponse = async () => {
    if (!userInput.trim()) return;

    try {
      const updatedMessages = [...messages, { type: "user", text: userInput }];
      setMessages(updatedMessages);
      setUserInput("");
      setHasInteracted(true);

      setAllUserInputs((prev) => (prev ? `${prev}\n${userInput}` : userInput));

      setIsResponding(true);
      setScanPhase("waiting");

      // Keep only the last 12 messages to prevent exceeding token limits
      const apiMessages = updatedMessages.slice(-12).map(msg => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.rawText || msg.text || ""
      }));

      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, turnstileToken })
      });
      const textResponse = await response.text();

      if (streaming) {
        // Typing effect
        setScanPhase("typing");
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: "",
            rawText: textResponse || "Sorry, I couldn't respond.",
            isTyping: true,
          },
        ]);
      } else {
        // Instant — no streaming
        setScanPhase("idle");
        setIsResponding(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: textResponse || "Sorry, I couldn't respond.",
            isTyping: false,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      setIsResponding(false);
      setScanPhase("idle");
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: "Something went wrong. Please try again." },
      ]);
    }
  };

  // Typing effect
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.isTyping) {
      let currentIndex = 0;
      const charsPerTick = TYPING_SPEEDS[typingSpeed] || 3;
      const interval = setInterval(() => {
        if (currentIndex < lastMsg.rawText.length) {
          setMessages((prev) => {
            const newMessages = [...prev];
            const currentMsg = { ...newMessages[newMessages.length - 1] };
            currentIndex += charsPerTick;
            if (currentIndex > lastMsg.rawText.length) {
              currentIndex = lastMsg.rawText.length;
            }
            currentMsg.text = lastMsg.rawText.substring(0, currentIndex);
            newMessages[newMessages.length - 1] = currentMsg;
            return newMessages;
          });
        } else {
          clearInterval(interval);
          setIsResponding(false);
          setScanPhase("idle");
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].isTyping = false;
            return newMessages;
          });
        }
      }, 15);

      return () => clearInterval(interval);
    }
  }, [messages.length, typingSpeed]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") fetchResponse();
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    });
  }, [messages]);

  const footerLinks = [
    {
      icon: <FaLinkedin className="h-6 w-6" />,
      href: "https://www.linkedin.com/in/ankitnayak-dev/",
    },
    {
      icon: <FaTwitter className="h-6 w-6" />,
      href: "https://x.com/AnkitNayak_dev",
    },
    {
      icon: <FaGithub className="h-6 w-6" />,
      href: "https://github.com/AnkitNayak-dev",
    },
  ];

  const currentFontSize = FONT_SIZES[fontSize] || "15px";

  return (
    <div className="flex flex-col h-screen text-white bg-[#0a0a0a]">

      {/* ─── Gear Icon (always visible) ─── */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-[#141420] border border-[#2a2a3e] hover:border-[#4a4a6e] hover:bg-[#1e1e30] transition-all duration-200 text-gray-400 hover:text-white"
        title="Settings"
      >
        <IoSettingsSharp size={18} />
      </button>

      {/* ─── Settings Modal ─── */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => setShowSettings(false)}
            />

            {/* Modal wrapper - flex center */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-md bg-[#111118] border border-[#2a2a3e] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a3e]">
                  <h2 className="text-lg font-semibold text-white">Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a2a3e] transition-colors text-gray-400 hover:text-white"
                  >
                    <IoClose size={20} />
                  </button>
                </div>

                {/* Settings Body */}
                <div className="px-6 py-5 space-y-6">

                  {/* Response Streaming */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] text-white font-medium">Response Streaming</p>
                      <p className="text-[13px] text-gray-500 mt-0.5">Show response with typing animation</p>
                    </div>
                    <button
                      onClick={() => setStreaming(!streaming)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${streaming ? "bg-purple-600" : "bg-[#2a2a3e]"
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${streaming ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>

                  {/* Animations */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] text-white font-medium">Animations</p>
                      <p className="text-[13px] text-gray-500 mt-0.5">Grid scan background & page transitions</p>
                    </div>
                    <button
                      onClick={() => setAnimationsEnabled(!animationsEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${animationsEnabled ? "bg-purple-600" : "bg-[#2a2a3e]"
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${animationsEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#2a2a3e]" />

                  {/* Font Size */}
                  <div>
                    <p className="text-[15px] text-white font-medium mb-3">Font Size</p>
                    <div className="flex gap-2">
                      {["small", "medium", "large"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className={`flex-1 py-2 rounded-lg text-[13px] font-medium capitalize transition-all duration-200 ${fontSize === size
                            ? "bg-purple-600 text-white"
                            : "bg-[#1a1a2e] text-gray-400 hover:text-white hover:bg-[#252540]"
                            }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typing Speed */}
                  <div>
                    <p className="text-[15px] text-white font-medium mb-3">Typing Speed</p>
                    <div className="flex gap-2">
                      {["slow", "normal", "fast"].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setTypingSpeed(speed)}
                          className={`flex-1 py-2 rounded-lg text-[13px] font-medium capitalize transition-all duration-200 ${typingSpeed === speed
                            ? "bg-purple-600 text-white"
                            : "bg-[#1a1a2e] text-gray-400 hover:text-white hover:bg-[#252540]"
                            }`}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#2a2a3e]">
                  <p className="text-[12px] text-gray-600 text-center">Settings are saved automatically</p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Home Page ─── */}
      {!hasInteracted && (
        animationsEnabled ? (
          <HeroHighlight className="relative z-10">
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 transition-all duration-500 relative z-20 font-mono">
              {animationsEnabled ? (
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: [20, -5, 0] }}
                  transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
                  className="relative mb-8 z-10 text-5xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 text-center font-sans font-bold"
                >
                  What can I help with?
                </motion.h1>
              ) : (
                <h1 className="relative mb-8 z-10 text-5xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 text-center font-sans font-bold">
                  What can I help with?
                </h1>
              )}

              {animationsEnabled ? (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: [20, -5, 0] }}
                  transition={{ duration: 1, ease: [0.4, 0.0, 0.2, 1] }}
                  className="text-lg text-gray-400"
                >
                  Powered by the{" "}
                  <Highlight className="text-white text-xl font-bold font-serif">Private, uncensored AI GPT-OSS 120B</Highlight> API.
                  It delivers advanced, context-aware, and human-like
                  responses <br /> for a wide range of AI applications, rivaling
                  the capabilities of top-tier models in both
                  performance and versatility.
                </motion.p>
              ) : (
                <p className="text-lg text-gray-400">
                  Powered by the{" "}
                  <Highlight className="text-white text-xl font-bold font-serif">Private, uncensored AI GPT-OSS 120B</Highlight> API.
                  It delivers advanced, context-aware, and human-like
                  responses <br /> for a wide range of AI applications, rivaling
                  the capabilities of top-tier models in both
                  performance and versatility.
                </p>
              )}

              {animationsEnabled ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: [20, -5, 0] }}
                  transition={{ duration: 1.5, ease: [0.4, 0.0, 0.2, 1] }}
                  className="flex items-center gap-3 w-full max-w-xl mt-6"
                >
                  <HoverBorderGradient
                    containerClassName="rounded-full flex-1 !w-full"
                    as="div"
                    duration={1}
                    className="flex items-center w-full !px-0 !py-0"
                  >
                    <input
                      type="text"
                      placeholder="Message GPT-OSS..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="w-full px-5 py-3.5 bg-transparent text-white text-left placeholder-gray-500 focus:outline-none text-base"
                    />
                  </HoverBorderGradient>
                  <HoverBorderGradient
                    containerClassName="rounded-full"
                    as="button"
                    duration={1}
                    onClick={fetchResponse}
                    className="flex items-center justify-center !px-4 !py-3.5"
                  >
                    <IoIosSend size={24} className="text-white" />
                  </HoverBorderGradient>
                </motion.div>
              ) : (
                <div className="flex items-center gap-3 w-full max-w-xl mt-6">
                  <HoverBorderGradient
                    containerClassName="rounded-full flex-1 !w-full"
                    as="div"
                    duration={1}
                    className="flex items-center w-full !px-0 !py-0"
                  >
                    <input
                      type="text"
                      placeholder="Message GPT-OSS..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="w-full px-5 py-3.5 bg-transparent text-white text-left placeholder-gray-500 focus:outline-none text-base"
                    />
                  </HoverBorderGradient>
                  <HoverBorderGradient
                    containerClassName="rounded-full"
                    as="button"
                    duration={1}
                    onClick={fetchResponse}
                    className="flex items-center justify-center !px-4 !py-3.5"
                  >
                    <IoIosSend size={24} className="text-white" />
                  </HoverBorderGradient>
                </div>
              )}

              {animationsEnabled ? (
                <motion.nav
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: [20, -5, 0] }}
                  transition={{ duration: 2, ease: [0.4, 0.0, 0.2, 1] }}
                  className="flex flex-row m-8 items-center gap-8"
                >
                  {footerLinks.map((link, index) => (
                    <a
                      href={link.href}
                      key={index}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 transform hover:scale-150 transition-transform duration-300 ease-in-out"
                    >
                      <span>{link.icon}</span>
                    </a>
                  ))}
                </motion.nav>
              ) : (
                <nav className="flex flex-row m-8 items-center gap-8">
                  {footerLinks.map((link, index) => (
                    <a
                      href={link.href}
                      key={index}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 transform hover:scale-150 transition-transform duration-300 ease-in-out"
                    >
                      <span>{link.icon}</span>
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </HeroHighlight>
        ) : (
          <div className="relative h-screen flex items-center bg-black justify-center w-screen">
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-20 font-mono">
              <h1 className="relative mb-8 z-10 text-5xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 text-center font-sans font-bold">
                What can I help with?
              </h1>
              <p className="text-lg text-gray-400">
                Powered by the{" "}
                <span className="inline-block pb-1 px-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xl font-bold font-serif">Private, uncensored AI GPT-OSS 120B</span> API.
                It delivers advanced, context-aware, and human-like
                responses <br /> for a wide range of AI applications, rivaling
                the capabilities of top-tier models in both
                performance and versatility.
              </p>
              <div className="flex items-center gap-3 w-full max-w-xl mt-6">
                <HoverBorderGradient
                  containerClassName="rounded-full flex-1 !w-full"
                  as="div"
                  duration={1}
                  className="flex items-center w-full !px-0 !py-0"
                >
                  <input
                    type="text"
                    placeholder="Message GPT-OSS..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full px-5 py-3.5 bg-transparent text-white text-left placeholder-gray-500 focus:outline-none text-base"
                  />
                </HoverBorderGradient>
                <HoverBorderGradient
                  containerClassName="rounded-full"
                  as="button"
                  duration={1}
                  onClick={fetchResponse}
                  className="flex items-center justify-center !px-4 !py-3.5"
                >
                  <IoIosSend size={24} className="text-white" />
                </HoverBorderGradient>
              </div>
              <nav className="flex flex-row m-8 items-center gap-8">
                {footerLinks.map((link, index) => (
                  <a
                    href={link.href}
                    key={index}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transform hover:scale-150 transition-transform duration-300 ease-in-out"
                  >
                    <span>{link.icon}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )
      )}

      {/* ─── GridScan Background ─── */}
      {hasInteracted && animationsEnabled && (
        <div className="fixed inset-0 z-0 opacity-50">
          <GridScan
            isScanning={scanPhase !== "idle"}
            scanPhase={scanPhase}
            sensitivity={0.55}
            lineThickness={1}
            linesColor="#1a1a2e"
            gridScale={0.1}
            scanColor="#a855f7"
            scanOpacity={0.5}
            enablePost={true}
            bloomIntensity={0.6}
            chromaticAberration={0.002}
            noiseIntensity={0.01}
            scanGlow={0.5}
            scanSoftness={2}
            scanDuration={1.5}
            scanDelay={0.5}
          />
        </div>
      )}

      {/* ─── Chat Messages ─── */}
      {hasInteracted && (
        <div className="flex-1 overflow-y-auto px-4 py-6 flex justify-center relative font-sans z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="w-full max-w-3xl space-y-6 pt-4 pb-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex w-full ${msg.type === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  style={{ fontSize: currentFontSize }}
                  className={`leading-relaxed break-words ${msg.type === "user"
                    ? "bg-[#1a1a2e] text-gray-100 px-5 py-3 rounded-2xl rounded-tr-sm max-w-[75%]"
                    : "text-gray-200 flex-1 min-w-0"
                    }`}
                >
                  {msg.type === "user" ? (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  ) : (
                    <MarkdownRenderer content={msg.text} />
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isResponding && messages[messages.length - 1]?.type === "user" && (
              <div className="flex w-full justify-start">
                <div className="flex items-center gap-1.5 py-3">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ─── Input Bar ─── */}
      {hasInteracted && (
        <div className="w-full bg-[#0a0a0a] border-t border-[#1e1e2e] p-4 flex-shrink-0 z-10 font-sans">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="flex-1 flex items-center bg-[#141420] border border-[#2a2a3e] rounded-full overflow-hidden focus-within:border-[#4a4a6e] transition-colors">
              <input
                type="text"
                placeholder="Message GPT-OSS..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full px-5 py-3.5 bg-transparent text-white text-left placeholder-gray-500 focus:outline-none text-[15px]"
              />
            </div>
            <button
              onClick={fetchResponse}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#141420] border border-[#2a2a3e] hover:border-[#4a4a6e] hover:bg-[#1e1e30] transition-all duration-200 text-gray-300 hover:text-white"
            >
              <IoIosSend size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Global Turnstile Widget ─── */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <div className="flex justify-center p-2 bg-[#0a0a0a] z-50">
          <Turnstile 
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
            onSuccess={(token) => setTurnstileToken(token)} 
            options={{ theme: 'dark' }}
          />
        </div>
      )}
    </div>
  );
}
