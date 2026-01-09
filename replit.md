# Overview

This is a full-stack e-commerce application for "IndoSaga Furniture" - a premium teak wood furniture store. The application features a React frontend with a modern UI built using shadcn/ui components, and an Express.js backend with PostgreSQL database integration using Drizzle ORM. The application includes core e-commerce functionality like product catalog, shopping cart, wishlist, user authentication, and order management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Design System**: Custom color palette with warm, furniture-themed colors (browns, beiges, neutrals)
- **Component Structure**: Modular components with separation between UI components, pages, and business logic

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Management**: Express sessions with PostgreSQL session storage
- **API Design**: RESTful API endpoints with proper error handling and validation
- **Development Setup**: Hot reload with Vite integration for full-stack development

## Database Schema
- **Users**: Authentication and profile management
- **Products**: Furniture catalog with categories, pricing, and inventory
- **Categories**: Product categorization system
- **Cart Items**: Shopping cart functionality with user sessions
- **Wishlist Items**: User wishlist management
- **Orders & Order Items**: Order processing and history
- **Contact Inquiries**: Customer support and inquiries
- **Sessions**: Server-side session storage

## Authentication & Authorization
- **Auth0 Integration**: Client-side Auth0 authentication with server session sync
- **User Management**: User registration, login, and profile management through Auth0
- **Protected Routes**: Client-side route protection based on authentication status
- **Session Storage**: Server-side session management for authenticated users

## Key Features
- **Product Catalog**: Browse products with search, filtering, and categorization
- **Shopping Cart**: Add/remove items, quantity management, and checkout
- **Wishlist**: Save favorite items for later
- **Flash Deals**: Special ₹1 deals with countdown timers
- **Responsive Design**: Mobile-first design with responsive navigation
- **Real-time Updates**: Optimistic updates and cache invalidation with React Query

# External Dependencies

## Core Technologies
- **@neondatabase/serverless**: PostgreSQL serverless database connection
- **drizzle-orm**: TypeScript ORM for database operations
- **drizzle-kit**: Database migration and schema management tools

## Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **@radix-ui/***: Accessible UI primitives for components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **date-fns**: Date manipulation utilities

## Backend Libraries
- **express**: Web application framework
- **connect-pg-simple**: PostgreSQL session store
- **zod**: Schema validation
- **drizzle-zod**: Integration between Drizzle and Zod for validation

## Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety across the application
- **@replit/vite-plugin-***: Replit-specific development tools
- **esbuild**: Fast JavaScript bundler for production builds

## UI Components
The application uses a comprehensive set of shadcn/ui components including forms, dialogs, navigation, data display, and feedback components, all built on top of Radix UI primitives for accessibility.