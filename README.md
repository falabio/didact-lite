# Didact: AI-Powered EdTech for Nigerian Educators

**Live Demo:** [didact.com.ng](https://didact.com.ng)

📌 **Project Overview**

I am a JSS Science teacher who recognized a critical gap in the Nigerian education system: teachers spend hours manually drafting lesson plans and searching through years of BECE past questions.

Didact is a full-stack SaaS platform designed to automate these tasks. It leverages AI to generate localized lesson plans and provides a searchable database of BECE questions (2018–2025) to help teachers create mock exams in seconds.

🛠 **The Tech Stack**

This project demonstrates my ability to orchestrate modern, industry-standard tools:
- **Framework:** Next.js (React)
- **Authentication:** Clerk (Secure Identity Management)
- **Payments:** Paystack API (Tiered Subscription & Usage-based Billing)
- **Database:** SQLite (LibSQL Client)
- **Deployment:** Vercel (CI/CD)
- **AI Orchestration:** Google Gemini 3.1 Pro via agentic workflows (Google Antigravity)

🚀 **Key Features**

- **AI Lesson Plan Generator:** Automated generation based on the Nigerian JSS curriculum.
- **BECE Search Engine:** A specialized database covering 7 years of national exams, searchable by topic.
- **Automated Monetization:** Integrated Paystack for "Day Pass" and "Termly" access.
- **PDF Export:** Custom-formatted exam papers ready for classroom distribution.

🏗 **Technical Architecture**

- **State Management:** Using React hooks for seamless search filtering and component interaction.
- **Database Architecture:** A local SQLite database managed with `@libsql/client` ensuring lightning-fast reads (< 1 second) for thousands of indexed BECE past questions, alongside normalized `users` and `transactions` tables.
- **Webhook Integration:** Implemented idempotent Paystack webhooks to handle asynchronous payment confirmations and seamlessly update Clerk `publicMetadata` for real-time premium feature access.
- **Performance:** Optimized for 3G connectivity to ensure accessibility for teachers in low-bandwidth areas across Nigeria. Server-sent events (SSE) power real-time streaming of AI document generation.

👨‍🏫 **About the Developer**

I am transitioning from a Science Educator to Software Engineering. My unique edge is my ability to combine deep pedagogical knowledge with modern AI-assisted development (Vibe Coding). I build tools that don't just "work"—they solve real human problems.
