# Schoolgle SIAMS Dashboard

A modern Next.js dashboard application built with TypeScript, Tailwind CSS, and Supabase.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: tRPC
- **ORM**: Prisma
- **State Management**: React Query (TanStack Query)

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   ├── ui/             # shadcn/ui components
│   └── forms/          # Form components
├── lib/                # Utility libraries
│   ├── auth/           # Authentication utilities
│   ├── db/             # Database utilities
│   └── supabase.ts     # Supabase client
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── store/              # State management
```

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo-url>
   cd schoolgle-siams-dashboard
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Database setup**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `DATABASE_URL` - Your database connection string

### Supabase Setup

1. Create a new Supabase project
2. Get your project URL and anon key from Settings > API
3. Update your `.env.local` file
4. Run database migrations

## 📦 Key Dependencies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **Supabase** - Backend as a service
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - Database ORM
- **React Query** - Data fetching and caching

## 🚀 Deployment

The project is ready for deployment on Vercel, Netlify, or any platform that supports Next.js.

1. Build the project: `npm run build`
2. Deploy to your preferred platform
3. Set environment variables in your deployment platform
4. Run database migrations in production

## 📝 License

MIT License - see LICENSE file for details.