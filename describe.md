# Project Description

This project is a comprehensive student registration and management system designed for an educational center. It provides a robust, user-friendly platform for students to register and for administrators to efficiently manage student data, class schedules, teachers, materials, and centers. The system is built with a focus on data integrity, administrative efficiency, and a seamless user experience.

## Core Components

### 1. Student Registration Form (`index.html`)
This is the public-facing entry point for new student registrations. It is a dynamic, multi-step form that guides users through the process.

*   **Dynamic Dropdowns:** Features custom-styled dropdowns for selecting center, grade, material, teacher, and group/time. Options dynamically update based on previous selections (e.g., available group times change based on selected grade, teacher, material, and center).
*   **Real-time Validation:** Provides immediate feedback on input fields (e.g., name format, phone number validity) to ensure data quality before submission.
*   **Duplicate Prevention:** Checks for existing registrations based on student phone number and grade to prevent duplicate entries.
*   **User-Friendly Modals:** Utilizes various modals for communication, including success confirmations, warnings for full groups, and notifications for duplicate registrations.

### 2. Student Management Dashboard (`pages/admin.html`)
This is the primary interface for administrators to view, filter, search, and manage student data.

*   **Advanced Filtering:** Allows filtering of student lists by grade, teacher, material, and specific class group/time. Grade filters are presented as interactive cards with student counts.
*   **Search Functionality:** A search bar enables quick filtering of students by name or phone number.
*   **Data Visualization:** Displays key statistics, such as the total number of students and counts for each grade, dynamically updated based on applied filters.
*   **Student Details Modal:** Clicking on a student's record opens a detailed modal displaying all their registration information, including direct WhatsApp links for student and parent phone numbers.
*   **PDF Export:** Administrators can generate and download professional PDF reports of filtered student lists. Options include page orientation (landscape/portrait) and selection of visible students (current page or all filtered).
*   **Optimistic UI Updates:** Student deletion is handled with an optimistic UI update, providing immediate visual feedback while the background operation completes.
*   **Pagination:** Efficiently displays large datasets with client-side pagination controls.

### 3. Schedule Management Dashboard (`pages/schedule-admin.html`)
This page provides comprehensive tools for administrators to create, edit, and delete class schedules.

*   **Group and Time Management:** Define class groups (e.g., "Saturday & Tuesday") and assign multiple time slots to them using an intuitive time builder.
*   **Teacher & Material Assignment:** Each schedule can be assigned to a specific teacher and material, or marked as "General" (available to all).
*   **Full CRUD Operations:** Supports Create, Read, Update, and Delete (CRUD) functionality for schedules.
*   **Safe Deletion:** Includes logic to handle the deletion of teachers or materials, reassigning their associated students and schedules to a "General" category to prevent data loss and maintain data integrity.
*   **Filtering:** Filter schedules by grade, teacher, material, and group name.

### 4. Center Management (`pages/centers.html`)
A dedicated page for managing educational centers.

*   **CRUD Operations:** Allows administrators to add, edit, and delete centers.
*   **Safe Deletion:** When a center is deleted, all associated teachers and student registrations are automatically reassigned to a default "عام" (General) center to prevent orphaned records.

## Technical Details

*   **Backend:** The application is powered by **Supabase**, which provides a PostgreSQL database, authentication capabilities, and auto-generated RESTful APIs. Row Level Security (RLS) policies are extensively used to control data access.
*   **Database Schema:** The database schema is well-defined in `sql/schema.sql`, including tables for `centers`, `materials`, `teachers`, `schedules`, and `registrations_2025_2026`. It includes relationships, constraints, and default "General" entries for teachers, materials, and centers to facilitate reassignment upon deletion.
*   **Frontend:** The frontend is built with **vanilla JavaScript (ES Modules)**, HTML5, and CSS3. It utilizes:
    *   **Bootstrap 5 (RTL):** For responsive grid systems, components (modals, toasts), and overall layout, with right-to-left language support.
    *   **Tailwind CSS:** Used on the admin pages for utility-first styling, enhancing design flexibility and development speed.
    *   **Custom CSS:** For specific styling requirements and overrides.
*   **Modularity:** The JavaScript codebase is highly modular, organized into `services` (for Supabase interactions), `ui` (for UI components like dropdowns and modals), `features` (like PDF printing), and `pages` (for page-specific logic and state management).
*   **Security:** A strong emphasis on security is maintained through detailed Row Level Security (RLS) policies defined in `sql/security.sql`. These policies govern data access and modification within the Supabase database.
*   **Performance:** Implements techniques like debouncing for search inputs and server-side filtering/pagination on the admin dashboard to ensure responsiveness and efficient data handling.
*   **Version Control:** Uses a simple per-minute versioning system for JavaScript files to ensure rapid cache busting for urgent updates.