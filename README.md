# Uncensored GPT-OSS 120B Chat

A completely free, 100% anonymous, and fully uncensored AI chat interface powered by the **GPT-OSS 120B API**. This project was built to provide an unrestricted conversational AI experience with zero tracking.

![image](https://github.com/user-attachments/assets/47816e33-97c5-4792-822c-6a56a1eee9b0)

---

## Features

- **Ask Anything. We Don't Judge**: Completely uncensored interactions driven by a custom jailbreak prompt on the 120B model.
- **100% Anonymous**: No login, no signup, and absolutely no logs. Your privacy is guaranteed.
- **Premium UI/UX**: Features a highly polished, glassmorphic design, dynamic text animations (FlipWords), and fluid chat bubbles powered by Framer Motion.
- **Bot Protection**: Secured via **Cloudflare Turnstile** with a seamless, invisible verification flow.
- **Fair Usage Policy**: Built-in rate limiting using **Upstash Redis** (5 requests per minute) to ensure the service remains free and available for everyone.
- **Mobile Optimized**: Fully responsive layout with smart virtual keyboard handling and dynamic viewport sizing.

---

## Technology Stack

- **Framework**: Next.js (App Router)
- **API Runtime**: Edge Runtime for lightning-fast responses
- **Frontend**: React, TailwindCSS, Aceternity UI
- **Animations**: Framer Motion
- **Security & Rate Limiting**: Cloudflare Turnstile, `@upstash/ratelimit`, Redis
- **AI Integration**: `openai` SDK pointing to the GPT-OSS endpoints

---

## Getting Started

To run this project locally, clone the repository and set up your environment variables:

1. Copy `.env.example` to `.env` (or set them up in your environment).
2. You will need:
   - `OPENAI_API_KEY` (NVIDIA / GPT-OSS endpoint key)
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` & `TURNSTILE_SECRET_KEY`
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`
3. Run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Contribution

This is a free hobby project! Feel free to contribute by submitting issues or creating pull requests. 

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
