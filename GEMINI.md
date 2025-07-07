
# Gemini Project Guidelines

This document provides instructions for the Gemini AI to follow when interacting with this project.

## Project Overview

This is a student registration system for an educational center. It consists of a public-facing registration form (`index.html`) and two admin pages (`admin.html` for viewing students and `schedule-admin.html` for managing class schedules). The project uses HTML, CSS, and vanilla JavaScript with Supabase as the backend.

## Key Technologies

-   **Frontend:** HTML, CSS, JavaScript (ES Modules)
-   **Backend:** Supabase (PostgreSQL database, Auth, and APIs)
-   **Styling:** Bootstrap 5, custom CSS, and Tailwind CSS on the admin page.
-   **Libraries:** Font Awesome, html2canvas, html2pdf.js.

## Core Conventions

1.  **File Structure:**
    *   JavaScript logic is modularized and located in the `js/` directory.
    *   Admin page logic is further organized into subdirectories under `js/pages/admin/` and `js/pages/schedule-admin/`.
    *   Shared services (like `registration-service.js`, `teacher-service.js`) are in `js/services/`.
    *   UI components (like modals, dropdowns) are in `js/ui/` and `js/components/`.
    *   CSS files are in the `css/` directory.
    *   HTML pages are in the root and `pages/` directory.

2.  **JavaScript Style:**
    *   Use ES Modules (`import`/`export`).
    *   Code is organized into functions and modules. State management is handled in `state.js` files for each admin page.
    *   Use `async/await` for all Supabase calls.
    *   Follow the existing naming conventions (e.g., `camelCase` for variables and functions).
    *   Add comments to explain complex logic, not just what the code does.

3.  **Supabase Interaction:**
    *   All Supabase client instances are created in `js/supabase-client.js` and imported where needed.
    *   Row Level Security (RLS) is enabled on all tables. Be mindful of these policies when making changes. The policies are defined in `sql/security.sql`.
    *   The database schema is defined in `sql/schema.sql`.

4.  **Admin Panel Logic:**
    *   The admin pages (`admin.html` and `schedule-admin.html`) fetch data on load and then perform filtering and rendering on the client side.
    *   The admin pages are not currently behind an authentication wall. This is a known security risk.

## How to Approach Changes

1.  **Understand the Goal:** Before writing any code, understand what the user wants to achieve.
2.  **Analyze Existing Code:** Read the relevant files to understand how the feature is currently implemented. Use the file structure as a guide.
3.  **Follow Patterns:** Mimic the existing code style, structure, and patterns. For example, if adding a new filter, follow the pattern in `js/pages/admin/filters.js`.
4.  **Test Your Changes:** After making changes, manually test them in the browser to ensure they work as expected and do not introduce any new bugs.
5.  **Security First:** Do not introduce any changes that would worsen the existing security posture. Be aware of the RLS policies.
