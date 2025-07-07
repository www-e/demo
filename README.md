# Education Center Student Management System

Welcome to the **Education Center Student Management System**, a comprehensive solution designed to streamline student registration, class scheduling, and administrative tasks for educational centers. Developed by **Omar Ashraf**, this system prioritizes user-friendliness, modern design, and robust data handling, leveraging a powerful Supabase backend.

## ✨ Key Features

### Student Registration Form (`index.html`)
A public-facing, multi-step form for new student registrations.
*   **Smart, Multi-Step Process:** Guides users through registration, dynamically adapting options based on selections (e.g., grade, teacher, material, center).
*   **Intuitive Custom Dropdowns:** Beautifully styled and functional dropdowns for a clean user interface.
*   **Real-Time Validation:** Provides instant feedback, ensuring data accuracy (e.g., phone number formats, name length).
*   **Proactive Duplicate Prevention:** Intelligently checks for existing registrations by phone number and grade to prevent duplicate entries.
*   **Clear Confirmation & Feedback:** Users receive immediate, well-designed confirmation via on-screen modals upon successful registration, including a summary of their details.

### Admin Dashboard (`pages/admin.html`)
A powerful interface for administrators to view and manage student data.
*   **Advanced Filtering & Search:** Filter student lists by grade, teacher, material, and class group/time. A search bar allows quick lookup by name or phone number.
*   **Data Visualization:** Displays key statistics like total students and counts per grade.
*   **Student Details Modal:** Clicking on a student's record opens a detailed modal with all their information, including direct WhatsApp contact links.
*   **Professional PDF Export:** Generate and download customizable PDF reports of student lists, with options for page orientation and column selection.
*   **Optimistic UI Updates:** Provides a smooth user experience with immediate visual feedback on actions like student deletion, followed by server confirmation.

### Schedule Management Dashboard (`pages/schedule-admin.html`)
Dedicated interface for creating, editing, and deleting class schedules.
*   **Group and Time Management:** Define class groups (e.g., "Saturday & Tuesday") and assign multiple time slots.
*   **Teacher & Material Assignment:** Assign schedules to specific teachers and materials, or mark them as "General" for broader availability.
*   **Full CRUD Operations:** Comprehensive Create, Read, Update, and Delete (CRUD) functionality for schedules.
*   **Safe Deletion with Reassignment:** Includes logic to safely delete teachers, materials, or centers, reassigning associated students and schedules to a "General" category to prevent data loss.
*   **Intuitive Time Builder:** A user-friendly interface for adding and managing multiple time slots for each group.

### Center Management (`pages/centers.html`)
A simple interface for managing educational centers.
*   **CRUD Operations:** Add, edit, and delete centers.
*   **Safe Deletion:** When a center is deleted, associated teachers and students are reassigned to a "General" center.

## 🚀 Technologies Used

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules)
*   **Styling:** Bootstrap 5 (RTL), Tailwind CSS (for admin pages), Custom CSS
*   **Backend:** Supabase (PostgreSQL Database, Authentication, Realtime, and Auto-generated APIs)
*   **Libraries:**
    *   Font Awesome (Icons)
    *   html2canvas & html2pdf.js (for PDF generation)
    *   Bootstrap (JS components)

## 🛠️ Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd DemoEducationCenter/form
    ```
2.  **Set up Supabase:**
    *   Go to [Supabase](https://supabase.com/) and create a new project.
    *   Copy the SQL schema from `sql/schema.sql` and run it in your Supabase SQL Editor to set up the database tables, functions, and default data.
    *   Copy the RLS policies from `sql/security.sql` and run them in your Supabase SQL Editor to configure Row Level Security.
    *   Get your Supabase Project URL and `anon` public key from your project settings (API section).
3.  **Configure the application:**
    *   Open `js/config.js`.
    *   Replace the placeholder `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your actual Supabase project URL and public key.
    ```javascript
    export const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
    ```
4.  **Run the application:**
    *   Open `index.html` in your web browser to access the registration form.
    *   Open `pages/admin.html` to access the student management dashboard.
    *   Open `pages/schedule-admin.html` to access the schedule management dashboard.
    *   Open `pages/centers.html` to manage centers.

## 👨‍💻 Developed By

**Omar Ashraf**

A passionate developer focused on building user-centric web applications with clean code and modern design principles.

---
