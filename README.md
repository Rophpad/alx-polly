# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## 📋 Project Overview

ALX Polly is a comprehensive polling platform that enables users to create, share, and participate in polls with real-time results. The application demonstrates modern web development practices including server-side authentication, database operations, and responsive UI design.

### Key Features

- **🔐 Secure Authentication**: User registration, login, and session management with email verification
- **📊 Poll Management**: Create, edit, delete, and share polls with multiple options
- **🗳️ Voting System**: Anonymous and authenticated voting with real-time results
- **📱 Responsive Dashboard**: User-friendly interface for managing polls and viewing analytics
- **🛡️ Security Features**: Rate limiting, input validation, and authorization controls
- **⚡ Real-time Updates**: Live poll results and vote counting

## 🛠️ Tech Stack

### Frontend
- **[Next.js 14+](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Modern React component library
- **React Server Components** - Server-side rendering and optimization

### Backend & Database
- **[Supabase](https://supabase.io/)** - Backend-as-a-Service with PostgreSQL
- **Supabase Auth** - Authentication and user management
- **Row Level Security (RLS)** - Database-level authorization
- **Real-time subscriptions** - Live data updates

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v18.x or higher)
- **[npm](https://www.npmjs.com/)** or **[yarn](https://yarnpkg.com/)**
- **[Git](https://git-scm.com/)**
- A **[Supabase](https://supabase.io/)** account (free tier available)

### 1. Clone the Repository

```bash
git clone https://github.com/Rophpad/alx-polly.git
cd alx-polly
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Supabase Setup

#### Create a Supabase Project

1. Visit [Supabase](https://supabase.io/) and create a new account
2. Create a new project
3. Wait for the project to be fully provisioned

#### Database Schema Setup

Execute the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for polls
CREATE POLICY "Users can view all polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can create their own polls" ON polls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own polls" ON polls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own polls" ON polls FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for votes
CREATE POLICY "Users can view all votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can insert votes" ON votes FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX polls_user_id_idx ON polls(user_id);
CREATE INDEX polls_created_at_idx ON polls(created_at);
CREATE INDEX votes_poll_id_idx ON votes(poll_id);
CREATE INDEX votes_user_id_idx ON votes(user_id);
```

#### Get Supabase Credentials

1. Go to your project's **Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **Project API Key** (anon/public key)

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Add your Supabase credentials to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For development
NODE_ENV=development
```

**Important**: Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at **http://localhost:3000**.

## 📖 Usage Examples

### Creating Your First Poll

1. **Register an Account**
   - Navigate to `/register`
   - Fill in your name, email, and a secure password
   - Verify your email (check spam folder if needed)

2. **Login**
   - Go to `/login`
   - Enter your credentials

3. **Create a Poll**
   - Click "Create Poll" in the dashboard
   - Enter your poll question: "What's your favorite programming language?"
   - Add options: "JavaScript", "Python", "TypeScript", "Go"
   - Click "Create Poll"

### Voting on Polls

1. **Find Polls**
   - Browse available polls on the main dashboard
   - Click on any poll to view details

2. **Cast Your Vote**
   - Select your preferred option
   - Click "Submit Vote"
   - View real-time results with percentages and vote counts

### Managing Your Polls

1. **View Your Polls**
   - Access "My Polls" from the dashboard
   - See all polls you've created

2. **Edit a Poll**
   - Click "Edit" on any of your polls
   - Modify the question or options
   - Save changes

3. **Delete a Poll**
   - Click "Delete" on any of your polls
   - Confirm deletion in the dialog

### Sharing Polls

1. **Get Poll Link**
   - Open any poll detail page
   - Copy the URL from your browser
   - Share with others via social media or direct link

## 🧪 Testing the Application

### Manual Testing

1. **Authentication Flow**
   ```bash
   # Test user registration
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"SecurePass123!"}'
   ```

2. **Poll Creation**
   - Create polls with various question types
   - Test with minimum (2) and maximum options
   - Verify validation errors for invalid inputs

3. **Voting System**
   - Vote on polls both authenticated and anonymously
   - Test voting multiple times (should be prevented)
   - Verify real-time result updates

### Running Tests

```bash
# Run unit tests (if configured)
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🔧 Local Development

### Project Structure

```
alx-polly/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application pages
│   ├── api/               # API routes (if any)
│   ├── components/        # Shared components
│   └── lib/               # Utilities and actions
├── components/            # UI components (shadcn/ui)
├── lib/                   # Shared utilities
├── public/                # Static assets
└── supabase/             # Database migrations
```

### Key Files

- `app/lib/actions/auth-actions.ts` - Authentication logic
- `app/lib/actions/poll-actions.ts` - Poll management
- `app/lib/context/auth-context.tsx` - Global auth state
- `lib/supabase/` - Database client configuration

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

### Environment-Specific Configuration

#### Development
- Hot reloading enabled
- Detailed error messages
- Debug logging active

#### Production
- Optimized builds
- Error boundaries
- Performance monitoring

## 🛠️ Troubleshooting

### Common Issues

1. **Supabase Connection Errors**
   - Verify your `.env.local` file has correct credentials
   - Check if your Supabase project is active
   - Ensure RLS policies are properly configured

2. **Authentication Issues**
   - Confirm email verification is complete
   - Check spam folder for verification emails
   - Verify Supabase Auth settings

3. **Database Errors**
   - Ensure all required tables are created
   - Check RLS policies are enabled
   - Verify user permissions

### Getting Help

- Check the [Issues](https://github.com/Rophpad/alx-polly/issues) page
- Review Supabase [documentation](https://supabase.io/docs)
- Consult Next.js [documentation](https://nextjs.org/docs)

---

## 🔒 Security Features & Best Practices

This application implements several security measures:

### Authentication Security
- **Rate Limiting**: Prevents brute force attacks on login/registration
- **Password Requirements**: Enforces strong password policies
- **Email Verification**: Confirms user email addresses
- **Session Management**: Secure session handling with Supabase Auth

### Data Protection
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries through Supabase
- **XSS Protection**: Input sanitization and escape mechanisms
- **CSRF Protection**: Built-in Next.js CSRF protections

### Authorization
- **Row Level Security (RLS)**: Database-level access controls
- **User Ownership**: Users can only modify their own polls
- **API Rate Limiting**: Prevents abuse of API endpoints

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1. **Identify Vulnerabilities**:
   - Thoroughly review the codebase to find security weaknesses
   - Pay close attention to user authentication, data access, and business logic
   - Think about how a malicious actor could misuse the application's features

2. **Understand the Impact**:
   - For each vulnerability you find, determine the potential impact
   - Query your AI assistant about it. What data could be exposed?
   - What unauthorized actions could be performed?

3. **Propose and Implement Fixes**:
   - Once a vulnerability is identified, ask your AI assistant to fix it
   - Write secure, efficient, and clean code to patch the security holes
   - Ensure that your fixes do not break existing functionality for legitimate users

### Where to Start?

A good security audit involves both static code analysis and dynamic testing. Here's a suggested approach:

1. **Familiarize Yourself with the Code**:
   - Start with `app/lib/actions/` to understand how the application interacts with the database
   - Explore the page routes in the `app/(dashboard)/` directory. How is data displayed and managed?
   - Look for hidden or undocumented features. Are there any pages not linked in the main UI?

2. **Use Your AI Assistant**:
   - This is an open-book test. You are encouraged to use AI tools to help you
   - Ask your AI assistant to review snippets of code for security issues
   - Describe a feature's behavior to your AI and ask it to identify potential attack vectors
   - When you find a vulnerability, ask your AI for the best way to patch it

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Follow the existing code style and conventions
2. Add tests for new features
3. Update documentation as needed
4. Ensure all security best practices are followed

---

**Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting! 🕵️‍♂️**
