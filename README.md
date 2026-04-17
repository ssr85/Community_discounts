# Community Discounts platform

Community Discounts is a platform that uses AI to analyze community spending patterns and generate bulk negotiation opportunities for better deals.

## Prerequisites

- **Node.js**: v18.0.0 or later
- **Supabase**: A Supabase project for database and authentication
- **AI API Keys**: Access to OpenAI, Anthropic, and Hugging Face

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ssr85/Community_discounts.git
   cd Community_discounts
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Configuration

Create a `.env.local` file in the root directory and add the following environment variables:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DATABASE_PASSWORD=your_supabase_db_password

# AI Models
ANTHROPIC_API_KEY=your_anthropic_api_key
HF_TOKEN=your_huggingface_token
```

## Database Setup

To initialize the database schema in your Supabase project, run the following script:

```bash
npx tsx scripts/apply-schema.ts
```

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

