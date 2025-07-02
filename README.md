# Anonymous Journal Sharing App

A mobile-first web application that enables anonymous sharing of handwritten journal entries through admin-created community walls, featuring a simple upload interface and moderated content system.

## 🌟 Key Features

### For Users
- **Anonymous Participation** - No account registration required
- **Mobile-Optimized Upload** - Capture journal pages via camera or upload existing images
- **Community Walls** - View curated collections of approved journal entries
- **Persistent Access** - Browser storage maintains viewing access after submission
- **Multi-Image Support** - Upload multiple journal pages in a single submission
- **Real-time Updates** - See new entries as they're approved

### For Administrators
- **Admin Dashboard** - Comprehensive management interface
- **Wall Creation** - Create multiple community walls with unique codes and shareable links
- **Submission Moderation** - Review and approve/reject user submissions
- **Bulk Operations** - Approve or reject multiple submissions at once
- **Wall Management** - Edit settings, reorder entries, and manage content
- **Real-time Notifications** - Get notified of new submissions
- **Rich Text Support** - Use formatted descriptions for walls
- **Header Images** - Add custom header images to brand your walls

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **React Photo Album** for masonry layout
- **Yet Another React Lightbox** for image viewing
- **TipTap** for rich text editing

### Backend & Database
- **Supabase** for backend-as-a-service
- **PostgreSQL** database with real-time subscriptions
- **Supabase Storage** for image hosting
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates

### Key Dependencies
```json
{
  "@supabase/supabase-js": "^2.45.6",
  "react": "^18.2.0",
  "react-router-dom": "^6.23.1",
  "@tiptap/react": "^2.23.1",
  "react-photo-album": "^3.1.0",
  "yet-another-react-lightbox": "^3.23.4",
  "tailwindcss": "3.4.1"
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Modern web browser with camera support (for mobile uploads)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd anonymous-journal-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Set these in your deployment environment or Tempo project settings:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_PROJECT_ID=your_project_id
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

4. **Set up Supabase database**
   Run the migration files in order:
   ```bash
   # Apply database migrations
   supabase db push
   ```

5. **Configure Supabase Storage**
   - Create an "images" bucket in Supabase Storage
   - Set appropriate policies for public read access
   - Configure upload policies for authenticated users

6. **Start development server**
   ```bash
   npm run dev
   ```

### Database Schema

The app uses three main tables:

#### `walls`
- `id` (UUID, primary key)
- `title` (text)
- `description` (text, supports rich text)
- `wall_code` (text, unique 6-character code)
- `shareable_link` (text)
- `is_private` (boolean)
- `header_image_url` (text, optional)
- `created_at` (timestamp)

#### `submissions`
- `id` (UUID, primary key)
- `wall_id` (UUID, foreign key to walls)
- `image_url` (text)
- `status` (enum: pending, approved, rejected)
- `submitted_at` (timestamp)

#### `entries`
- `id` (UUID, primary key)
- `wall_id` (UUID, foreign key to walls)
- `image_url` (text)
- `created_at` (timestamp)

## 📱 Usage Guide

### For End Users

1. **Access a Community Wall**
   - Receive a shareable link or wall code from an admin
   - Enter the code on the home page or visit the direct link

2. **Submit Your Journal Entry**
   - First-time visitors must submit an entry to view the wall
   - Use camera to capture journal pages or upload existing images
   - Support for multiple images in one submission
   - Submissions require admin approval before appearing on the wall

3. **View the Community Wall**
   - Browse approved journal entries in a masonry layout
   - Click images to view in full-screen lightbox
   - Submit additional entries anytime
   - Share the wall with others

### For Administrators

1. **Create Admin Account**
   - Sign up on the home page
   - Confirm email address
   - Log in to access admin dashboard

2. **Create Community Walls**
   - Set title and rich text description
   - Add optional header image
   - Configure privacy settings
   - Get unique wall code and shareable link

3. **Manage Submissions**
   - Review pending submissions with image preview
   - Approve or reject individual submissions
   - Use bulk operations for multiple submissions
   - Real-time notifications for new submissions

4. **Wall Management**
   - Edit wall settings and descriptions
   - Reorder entries with drag-and-drop
   - Delete inappropriate content
   - View wall analytics

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npm run types:supabase  # Generate TypeScript types from Supabase

# Linting
npm run lint         # Run ESLint
```

### Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── AdminDashboard.tsx
│   ├── CommunityWall.tsx
│   ├── JournalUploader.tsx
│   ├── WallCreationForm.tsx
│   ├── WallPage.tsx
│   └── home.tsx
├── lib/                 # Utility libraries
│   ├── supabase.ts     # Supabase client and API functions
│   └── utils.ts        # General utilities
├── types/              # TypeScript type definitions
│   └── supabase.ts     # Generated Supabase types
└── App.tsx             # Main application component
```

### Key Components

- **`AdminDashboard`** - Main admin interface with tabs for walls and submissions
- **`CommunityWall`** - Public wall display with masonry layout and lightbox
- **`JournalUploader`** - Mobile-optimized image upload component
- **`WallCreationForm`** - Form for creating and editing walls
- **`WallPage`** - Wall container that handles routing and data loading

## 🔒 Security & Privacy

### Data Protection
- No personal information collected from users
- Anonymous submissions with no user tracking
- Admin authentication required for management functions
- Row Level Security (RLS) policies on all database tables

### Content Moderation
- All user submissions require admin approval
- Admins can reject inappropriate content
- Bulk moderation tools for efficiency
- Real-time notifications for new submissions

### Image Storage
- Secure image upload to Supabase Storage
- Public read access for approved images only
- Automatic image optimization and CDN delivery
- File type and size validation

## 🚀 Deployment

### Production Checklist

1. **Environment Configuration**
   - Set all required environment variables
   - Configure Supabase project for production
   - Set up custom domain (optional)

2. **Database Setup**
   - Run all migrations
   - Configure RLS policies
   - Set up storage bucket and policies

3. **Build and Deploy**
   ```bash
   npm run build
   # Deploy dist/ folder to your hosting provider
   ```

### Recommended Hosting
- **Vercel** - Automatic deployments with GitHub integration
- **Netlify** - Simple static site hosting
- **Supabase Hosting** - Integrated with your backend

## 🐛 Troubleshooting

### Common Issues

1. **Images not uploading**
   - Check Supabase Storage bucket exists and is named "images"
   - Verify storage policies allow uploads
   - Ensure file size is under 10MB limit

2. **Wall not found errors**
   - Verify wall code is exactly 6 characters
   - Check database connection
   - Ensure wall exists and is not deleted

3. **Authentication issues**
   - Confirm Supabase project URL and keys are correct
   - Check email confirmation for new admin accounts
   - Verify RLS policies allow admin access

4. **Real-time updates not working**
   - Check Supabase real-time is enabled
   - Verify subscription setup in components
   - Ensure database triggers are configured

### Debug Tools

- Browser developer tools for client-side debugging
- Supabase dashboard for database and storage inspection
- Network tab to monitor API calls and uploads
- Console logs throughout the application for troubleshooting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use existing UI components from shadcn/ui
- Maintain mobile-first responsive design
- Add proper error handling and user feedback
- Include console logging for debugging
- Test on multiple devices and browsers

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review Supabase documentation for backend issues
- Open an issue in the repository
- Contact the development team

---

**Built with ❤️ for anonymous journal sharing and community building**