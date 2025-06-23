# NexusComply

A comprehensive compliance management system designed to streamline and automate compliance processes for multi-outlet businesses, particularly in the food and beverage industry.

## Overview

NexusComply is a modern, full-stack application that helps businesses manage their compliance requirements across multiple locations. The system consists of two main components:

1. **Web Application (Admin & Manager Portal)**: A Laravel/React-based web interface for administrators and managers to oversee compliance, manage users, and handle audit processes.
2. **Mobile Application**: A React Native app for outlet staff to submit compliance documentation and handle day-to-day compliance tasks.

## Architecture Overview

NexusComply follows a unified backend architecture where a single Laravel application serves both the web interface and mobile application:

### Backend (app_laravel/)
- **Dual Role Architecture**:
  1. Serves the web interface using Laravel with Inertia.js + React
  2. Functions as a REST API backend for the mobile application
- **Single Source of Truth**: All business logic and data management is centralized in one codebase
- **API Integration**: Dedicated API routes (prefixed with /api/mobile/) handle mobile app communications
- **Shared Authentication**: Unified authentication system serving both platforms

### Client Applications
- **Web Interface**: Direct integration with Laravel through Inertia.js
- **Mobile App**: Communicates with Laravel backend via REST API endpoints
- **Data Flow**:
  - Admins/Managers → Web Interface → Laravel Backend
  - Outlet Staff → Mobile App → Laravel API → Laravel Backend

## Key Features

### Admin Portal Features
- **Dynamic Form Builder**: Create custom compliance forms with multiple field types (text, checkbox, radio, file upload, etc.)
- **Compliance Framework Management**: Define and manage compliance categories, requirements, and associated forms
- **User & Role Management**: Comprehensive control over user roles, permissions, and access levels
- **Audit Management & Oversight**: 
  - Review and approve submitted compliance documentation
  - Track audit progress across all outlets
  - Generate compliance reports and analytics
  - Share form access with external auditors
- **System Configuration**: Manage system-wide settings and customize the platform

#### Outlet Management (Admin Only)

**Feature Name:** Outlet Management  
**Accessible By:** Exclusively by users with the 'Admin' role.

**Purpose:**
> Allows Administrators to centrally create, view, edit, and manage all business outlets registered in the NexusComply system.

**Core Functionalities Available to Admins:**
- View a comprehensive list of all created outlets with key details.
- Create new outlets, providing information such as:
  - Outlet Name
  - Full Address (street, city, state, postal code)
  - Phone Number
  - Structured Operating Hours: Define open/closed status and specific opening/closing times for each day of the week (Monday-Sunday).
- Edit the details of existing outlets, including their operating hours.
- Delete outlets from the system.
- Set an outlet's operational status (e.g., Active/Inactive).
- **Assign Key Personnel:**
  - Assign a specific 'Outlet User' (formerly 'Outlet Manager') to be primarily responsible for an outlet. _(Constraint: An Outlet User can only be assigned to one outlet at a time.)_
  - Assign a specific 'Manager' (formerly 'Regional Manager') to oversee an outlet. _(Constraint: A Manager can oversee multiple outlets.)_

**Interface:**
- Accessed via the Admin sidebar.
- Utilizes dedicated pages for listing, creating, and editing outlets, providing a full-page experience for detailed data entry.

### Manager Features
- **Regional Dashboard**: Monitor compliance metrics and activities for assigned outlets
- **Team Management**: 
  - Oversee outlet users in the assigned region
  - Track staff performance and activity
  - Manage user access and permissions within the region
- **Audit Review & Reporting**:
  - Review submitted compliance forms from outlets
  - Track audit progress and compliance status
  - Generate regional compliance reports
  - Share audit forms with external stakeholders

### Mobile App Features (Outlet Staff)
- Offline-capable form submission
- Photo and document upload capabilities
- Real-time compliance task notifications
- Digital checklist completion
- Instant submission of compliance documentation

## User Roles

### Administrator
- Full system access and configuration capabilities
- Manage compliance frameworks and form templates
- Oversee all users and role assignments
- Access system-wide analytics and reporting

### Manager
- Manage and monitor multiple outlets in assigned region
- Review and approve compliance submissions
- Handle staff management for regional outlets
- Generate regional compliance reports

### Outlet User
- Submit compliance documentation
- Manage outlet-level staff
- Track outlet compliance status
- Handle day-to-day compliance tasks

### External Auditor
- Review assigned compliance documents
- Provide feedback and approvals
- Access specific shared forms and reports

## Technology Stack

### Web Application (Admin & Manager Portal)
- **Backend**: Laravel (PHP)
- **Frontend**: React with Inertia.js
- **UI Framework**: Tailwind CSS
- **State Management**: React Hooks
- **Authentication**: Laravel Sanctum with Bouncer for roles/permissions
- **API**: RESTful endpoints for mobile app integration

### Mobile Application
- React Native
- Redux for state management
- Offline storage capabilities
- Native device feature integration

## Project Structure

```
NexusComply/
├── app_laravel/                 # Web application & API Backend
│   ├── resources/
│   │   └── js/
│   │       ├── Pages/          # React components for web interface
│   │       │   ├── Admin/      # Admin-specific pages
│   │       │   └── Manager/    # Manager pages
│   │       ├── Components/     # Shared React components
│   │       └── Layouts/        # Layout components
│   ├── routes/
│   │   ├── web.php            # Web interface routes
│   │   └── api.php            # Mobile app API endpoints
│   └── ...
├── app_mobile/                 # React Native mobile application
│   ├── src/                   # Mobile app source code
│   ├── android/               # Android-specific files
│   └── ios/                   # iOS-specific files
└── ...
```

## Key Designed Pages (Admin/Manager)

### Admin Portal
- **Authentication**: Login, password reset, and account recovery
- **Dashboard**: Key metrics, activity monitoring, and quick actions
- **User Management**: User creation, role assignment, and activity tracking
- **Compliance Framework**: Category setup and form template management
- **Form Builder**: Dynamic form creation with multiple field types
- **Audit Management**: Review submissions, track progress, generate reports
- **Settings**: Role permissions, system configuration, and customization

### Manager Portal
- **Dashboard**: Regional metrics and outlet performance overview
- **Team Management**: Outlet user oversight and staff activity tracking
- **Audit Review**: Form submission review and approval workflow
- **Reports**: Regional compliance status and audit history

## Technology Stack

### Backend & Web Application (`app_laravel/`)
- **Backend Framework:** Laravel 11
- **Frontend:** React.js integrated via Inertia.js
- **Database:** MySQL
- **Authentication:** Laravel Breeze (with Inertia.js React stack)
- **Development Environment:** Laragon
- **Role-Based Access Control:** silber/bouncer

### Mobile Application (`app_mobile/`)
- **Framework:** React Native with Expo
- **Navigation:** Expo Router (file-based routing)
- **Styling:** React Native StyleSheet API
- **Icons:** Expo Vector Icons (Ionicons)
- **Primary User:** Outlet Users

#### Key Features for Outlet Users
- **Secure Authentication:**
  - User-friendly login interface
  - Password recovery and reset functionality
  - Session management
- **Dashboard Overview:**
  - Personalized welcome with outlet information
  - Summary cards showing audit status counts
  - Quick access to pending and required submissions
  - Recent submission history with status indicators
- **Comprehensive Audit Management:**
  - Select from available compliance form types
  - Fill dynamic forms with various input types:
    - Text fields (single and multi-line)
    - Yes/No/N/A selection fields
    - Photo uploads with preview
    - Document attachments
    - Notes and comments
    - Issue flagging for follow-up
  - Save drafts of in-progress audits
  - Submit completed audits for manager review
  - Track submission status (Pending, Approved, Rejected)
- **Records & Reporting:**
  - View past audit records and their statuses
  - Access detailed view of submitted audits
  - Print preview functionality for forms
  - Generate reports for completed audits
- **User Profile Management:**
  - View and edit profile information
  - Manage notification preferences
  - Access account settings

#### Navigation Structure
- **Initial Auth Flow:**
  - Landing screen with app introduction
  - Login screen
  - Forgot password and reset password screens
- **Main Application (Post-Login):**
  - Bottom Tab Navigator with three primary sections:
    - Dashboard: Home screen with audit overview and quick actions
    - Audits: Main entry point for audit-related activities
    - Profile: User profile and settings
  - Audit Section (Stack Navigator):
    - Audit home screen with actions
    - Select compliance form type
    - Perform audit (dynamic form filling)
    - Past records viewer
    - Report details viewer
    - Print preview for completed forms

#### Setup/Running Instructions
```bash
# Navigate to the mobile app directory
cd app_mobile

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

After starting the development server, you can run the app on:
- iOS Simulator (press 'i')
- Android Emulator (press 'a')
- Physical device using Expo Go app (scan QR code)
- Web browser (press 'w')

The mobile app connects to the Laravel backend via REST API endpoints. During development, ensure the Laravel backend is running and accessible.

## Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js and npm/yarn
- MySQL
- Laragon (or alternative local development environment)
- Expo CLI
- Git

## Getting Started / Installation

### Clone the repository
```bash
git clone https://your-repository-url/NexusComply.git
cd NexusComply
```

### Backend & Web Application Setup (`app_laravel/`)
```bash
cd app_laravel
cp .env.example .env
```

Configure your database credentials and APP_URL in the `.env` file, then run:

```bash
composer install
php artisan key:generate
php artisan migrate --seed  # This will create the default admin user
npm install
```

> **Note:** When running the `php artisan migrate --seed` command, a default administrator user will be created with the following credentials:
> - Email: admin@example.com
> - Password: password
>
> It is strongly recommended to change this password after your first login.

### Mobile Application Setup (`app_mobile/`)
```bash
cd app_mobile  # From the NexusComply root
npm install  # or yarn install
```

Inside the mobile app's configuration, set the API base URL to point to your running `app_laravel` instance (e.g., http://localhost:8000 or your Laragon virtual host URL for the `app_laravel/public` directory).

## Running the Application

### Backend & Web Application (`app_laravel/`)
1. Ensure your Laragon services (Apache/Nginx, MySQL) are running.
2. In one terminal (inside `app_laravel/`): 
   ```bash
   npm run dev  # For Vite asset compilation
   ```
3. If not using a Laragon virtual host, in another terminal (inside `app_laravel/`):
   ```bash
   php artisan serve
   ```
4. Access the web application via your Laragon virtual host URL (e.g., http://nexuscomply.test) or http://localhost:8000.

### Mobile Application (`app_mobile/`)
1. In a terminal (inside `app_mobile/`):
   ```bash
   npx expo start
   ```
2. Follow the instructions provided by Expo CLI to open the app on an emulator, simulator, or physical device using the Expo Go app.

## Contributing

[Contribution guidelines to be added]

## License

[License information to be added]

## Deployment Strategy

NexusComply follows a monorepo approach for simplified deployment and maintenance:

### Repository Structure
- Single Git repository containing both `app_laravel` and `app_mobile`
- No duplication of backend code or separate repositories needed

### Backend Deployment (app_laravel)
- **Environment**: Standard PHP web server (VPS, PaaS, etc.)
- **Single Instance**: Serves both web interface and API endpoints
- **URLs**:
  - Web Interface: `https://yourprojectdomain.com`
  - Mobile API: `https://yourprojectdomain.com/api/mobile`
- **Configuration**: Environment-specific settings via `.env` file

### Mobile App Deployment (app_mobile)
- **Build Process**: 
  - Android: Generate signed APK/App Bundle
  - iOS: Create signed IPA file
- **API Configuration**: Mobile builds configured to target production API URL
- **Distribution**:
  - Development: Direct installation for testing
  - Production: Distribution through app stores

### Benefits
- Single source of truth for business logic
- Simplified maintenance and updates
- Consistent data handling across platforms
- Streamlined deployment process

## Admin Features

### User Management

The Admin User Management module provides comprehensive control over user accounts, with specific focus on Managers and Outlet Users.

#### User Roles

- **Admin**: Full system access and user management capabilities
- **Manager**: Oversees multiple outlets and their compliance activities
- **Outlet User**: Manages compliance for a single assigned outlet

#### User Management Features

1. **User Listing**
   - Separate tables for Managers and Outlet Users
   - Display of key information including name, email, role ID, and outlet assignments
   - Quick access to edit and delete actions

2. **User Creation**
   - Streamlined user creation with role selection
   - Automatic generation of role-specific IDs (e.g., "M-001" for Managers, "O-001" for Outlet Users)
   - Default password set to "password" with simulated email invitation
   - Role-specific outlet assignment:
     - Managers: Multiple outlet assignment via searchable checkbox list
     - Outlet Users: Single outlet assignment via searchable dropdown

3. **User Editing**
   - Modification of user details (name, email)
   - Role reassignment capabilities
   - Dynamic outlet assignment interface based on role:
     - Managers can be assigned to multiple outlets
     - Outlet Users can be assigned to a single outlet
   - Pre-filled form with current user data and assignments

4. **User Deletion**
   - Safe removal of users with automatic cleanup of outlet assignments
   - Protection against deletion of the primary admin account

#### Role ID System

The system uses a structured role ID format:
- Managers: "M-XXX" (e.g., M-001, M-002)
- Outlet Users: "O-XXX" (e.g., O-001, O-002)
- IDs are automatically generated and incremented

#### Initial Setup & Seeding

The system includes comprehensive seeders for initial data population:
- `AdminUserSeeder`: Creates the admin role and default admin user
- `ManagerSeeder`: Sets up the manager role and initial manager account
- `OutletUserSeeder`: Establishes the outlet-user role and sample account
- `DemoDataSeeder`: Generates realistic Malaysian-themed demo data including:
  - 20 outlets with Malaysian addresses and operating hours
  - 2 managers with Malaysian names
  - 20 outlet users with Malaysian names and proper role assignments

#### Security & Authorization

- Built on Laravel's authentication system
- Uses Bouncer for role-based access control
- Secure password handling and email verification
- Protected routes and role-specific access controls

#### UI/UX Features

- Modern, responsive interface using Tailwind CSS
- Enhanced searchable select components for outlet assignment
- Intuitive user creation and editing forms
- Clear visual distinction between user roles
- Efficient bulk outlet assignment for managers
- Real-time form validation and error handling

### Dynamic Form Builder

The Dynamic Form Builder is a powerful, user-friendly tool designed for Admins to create customizable form templates without writing code. These templates can be used for various compliance tasks throughout the application.

#### Purpose
The Form Builder enables Admins to design and maintain a library of reusable form templates that define the structure and fields for compliance submissions. Once created, these templates can be assigned to specific compliance requirements.

#### Key Features

1. **Visual Form Design Interface**
   - Intuitive drag-and-drop functionality for adding, configuring, and reordering form fields
   - Real-time preview of the form being built
   - Support for various field types:
     - Text inputs (single-line and multi-line)
     - Checkbox fields (single and grouped)
     - Radio button groups
     - Dropdown selects
     - Date pickers
     - File upload fields
     - Section headers and text blocks for better organization

2. **AI-Powered Excel Import**
   - **Import from Excel (AI-Powered)**: Revolutionary feature that converts existing Excel checklists into structured form templates
   - **Intelligent Processing**: Uses advanced AI to analyze Excel content and automatically generate appropriate form fields
   - **Smart Caching**: Implements file content-based caching to prevent redundant API calls
     - Files are identified by SHA256 hash for precise duplicate detection
     - Cached results are stored for 30 days using Laravel's database cache
     - Immediate response for previously processed files
   - **Content Analysis**: AI analyzes text from Excel cells and creates logical form structure with:
     - Appropriate field types (text, textarea, radio, checkbox groups, etc.)
     - Proper Yes/No/N/A options for compliance questions
     - Section headers for better organization
     - Required field detection
   - **Efficiency Benefits**:
     - Significantly reduces manual form creation time
     - Eliminates repetitive AI API calls for identical files
     - Provides instant results for previously uploaded files
     - Maintains consistency in form structure generation

3. **Field Configuration**
   - Detailed customization for each field:
     - Custom labels and placeholder text
     - Required field status toggling
     - Field-specific options (for radio buttons, checkboxes, dropdowns)
     - Help text and instructions

4. **Form Management**
   - Form templates can be saved as drafts during development
   - Templates can be published when ready for use in compliance requirements
   - Existing templates can be edited, previewed, and deleted
   - Protection against deleting templates that are currently in use

5. **Technical Implementation**
   - Form structures are stored as flexible JSON objects in the database
   - Frontend interface built with React and the react-beautiful-dnd library
   - Each form field has a unique ID and configurable properties
   - Forms are rendered dynamically using a dedicated FormRenderer component
   - AI integration with GitHub Models API (GPT-4) for intelligent Excel processing
   - Robust caching mechanism using Laravel's Cache facade with database storage

### Compliance Requirements Setup

The Compliance Requirements Setup module allows Admins to define and manage the specific compliance tasks that need to be completed by outlets.

#### Purpose
This module serves as the central place for Admins to establish what compliance documentation must be submitted, how frequently, and in what format (form or document upload).

#### Key Features

1. **Compliance Category Management**
   - Create, edit, and delete compliance categories (e.g., "Food Safety", "Fire Safety", "Employee Training")
   - For each category, define:
     - Title and description
     - Submission frequency (Daily, Weekly, Monthly, Quarterly, Bi-annually, Annually)
     - Active/Inactive status to control visibility

2. **Flexible Submission Types**
   - Two primary submission methods available:
     - **Form Template**: Assign a custom form created with the Dynamic Form Builder
     - **Document Upload Only**: Specify instructions for what documents need to be uploaded

3. **Conditional UI**
   - The interface intelligently adapts based on the selected submission type:
     - When "Form Template" is selected, shows a dropdown of available published form templates
     - When "Document Upload Only" is selected, provides a text area for document upload instructions

4. **Form Template Integration**
   - Seamless connection to the Dynamic Form Builder
   - Only published form templates are available for selection
   - Quick access to form template management directly from the compliance setup page
   - Preview capability for selected form templates

5. **Technical Implementation**
   - Database design with clear relationships between compliance requirements and form templates
   - Validation rules ensure proper data entry and relationships
   - Frontend modal interface for efficient creation and editing
   - Conditional form fields based on submission type

### Workflow Overview

The core setup workflow for an Admin using these features is:

1. **Form Builder**: First, use the Dynamic Form Builder to create reusable Form Templates for common checklists and audits.
2. **Compliance Requirements**: Next, in the Compliance Requirements Setup, create specific tasks and assign either a created Form Template or a simple document upload requirement to each task.

This two-step process defines what tasks Outlet Users will see and need to complete on their mobile app. The system allows for a flexible, adaptable compliance framework that can be easily modified as requirements change over time.

## Getting Started

[Installation and setup instructions...]

## Development

[Development guidelines...]

## Testing

[Testing instructions...]

## License

[License information...]