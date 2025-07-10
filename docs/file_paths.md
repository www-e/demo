# Project File Paths and Descriptions

This document provides an organized list of all files within the project, along with a brief description of their purpose and content.

## Root Directory
*   `describe.md`: Provides a comprehensive, detailed description of the project, its core components, and technical architecture.
*   `file_paths.md`: This file. Lists all project files and their descriptions.
*   `GEMINI.md`: Guidelines and context for the Gemini AI agent interacting with this project.
*   `index.html`: The main public-facing student registration form.
*   `README.md`: High-level overview of the project, its key features, technologies, and setup instructions.

## assets/ (Static Assets)
*   `assets/icons8-study-undefined-16.png`: Small icon for study-related imagery (16x16 pixels).
*   `assets/icons8-study-undefined-32.png`: Larger icon for study-related imagery (32x32 pixels).
*   `assets/center.png`: Image used in the form header and admin dashboards, likely a logo or branding.

## css/ (Cascading Style Sheets)
*   `css/dropdown-fix.css`: Specific CSS rules to fix styling and z-index issues for custom dropdowns.
*   `css/modal.css`: Styles for various informational and confirmation modals used across the registration form.
*   `css/registration.css`: Styles specific to the student registration form (`index.html`).
*   `css/schedule-admin.css`: Styles specific to the schedule administration page (`schedule-admin.html`), including layout, forms, and tables.
*   `css/student-modal-admin-page.css`: Styles for the student detail modal displayed on the admin dashboard.
*   `css/styles.css`: Global CSS variables and base styles applied across the entire application.
*   `css/tags.css`: Styles for displaying tags (e.g., for grades, teachers, materials, times).

## docs/ (Documentation)
*   `docs/issues.md`: Document for tracking known issues or potential improvements.

## js/ (JavaScript Modules)
*   `js/admin.js`: Main entry point for the student administration dashboard (`admin.html`), orchestrating data loading, filtering, and UI rendering.
*   `js/config.js`: Configuration file containing Supabase URL, API key, and other global constants.
*   `js/main.js`: Main entry point for the student registration form (`index.html`), handling form logic, data submission, and UI interactions.
*   `js/supabase-client.js`: Initializes and configures the Supabase client, including cache control headers.
*   `js/validation.js`: Contains functions for client-side form validation, including real-time validation and error display.
*   `js/versioner.js`: Script to apply a per-minute version string to JavaScript files for cache busting.

### js/components/ (Reusable UI Components)
*   `js/components/material-modal.js`: JavaScript class for managing the material creation/editing modal.
*   `js/components/teacher-modal.js`: JavaScript class for managing the teacher creation/editing modal.
*   `js/components/update-modal.js`: Manages and displays a "What's New" update modal to users.

### js/features/ (Specific Features)
*   `js/features/pdf-printer.js`: Implements the functionality for generating PDF reports from student data on the admin dashboard.

### js/pages/ (Page-Specific Logic)
*   `js/pages/centers.js`: JavaScript logic for the center management page (`centers.html`), handling CRUD operations for centers.

#### js/pages/admin/ (Admin Dashboard Specific Logic)
*   `js/pages/admin/constants.js`: Defines constants specific to the admin dashboard, such as grade names, colors, and pagination limits.
*   `js/pages/admin/crud-operations.js`: Handles Create, Read, Update, and Delete (CRUD) operations for student data on the admin dashboard, including optimistic UI updates.
*   `js/pages/admin/event-handlers.js`: Manages all event listeners for the admin dashboard, including filters, search, table interactions, and pagination.
*   `js/pages/admin/filter-cards.js`: Renders and updates the grade filter cards on the admin dashboard, displaying student counts.
*   `js/pages/admin/filters.js`: Applies various filters (grade, group, teacher, material, search) to student data, fetching results from Supabase.
*   `js/pages/admin/helpers.js`: Utility functions for the admin dashboard, such as time formatting, debouncing, and toast notifications.
*   `js/pages/admin/modal-manager.js`: Renders content within the student detail modal on the admin dashboard.
*   `js/pages/admin/page-loader.js`: Manages the display of a full-page loader during navigation or data loading.
*   `js/pages/admin/state.js`: Manages the global state for the admin dashboard, including student data, current filters, and pagination.
*   `js/pages/admin/supabase-client.js`: Supabase client interactions specific to the admin dashboard, including fetching students with filters and counts.
*   `js/pages/admin/table-renderer.js`: Renders the student data table and pagination controls on the admin dashboard.
*   `js/pages/admin/ui-renderer.js`: Re-exports functions from `table-renderer.js` and `filter-cards.js` for UI rendering.

#### js/pages/schedule-admin/ (Schedule Admin Specific Logic)
*   `js/pages/schedule-admin/dom-elements.js`: Centralized collection of DOM element references for the schedule administration page.
*   `js/pages/schedule-admin/event-handlers.js`: Manages event listeners and core logic for the schedule administration page, including saving, editing, and deleting schedules, teachers, and materials.
*   `js/pages/schedule-admin/main-admin.js`: Main entry point for the schedule administration dashboard, orchestrating data loading, UI initialization, and event handling.
*   `js/pages/schedule-admin/state.js`: Manages the global state for the schedule administration page, including schedules, teachers, and materials.
*   `js/pages/schedule-admin/table-handler.js`: Renders the schedule data table and handles filtering on the schedule administration page.
*   `js/pages/schedule-admin/time-builder.js`: Manages the interactive time selection and display for creating schedule time slots.
*   `js/pages/schedule-admin/ui-helpers.js`: Utility functions for the schedule administration UI, such as digit conversion, time formatting, and toast notifications.
*   `js/pages/schedule-admin/ui-manager.js`: Manages UI-related tasks for the schedule administration page, including populating dropdowns and resetting forms.

### js/services/ (Data Services)
*   `js/services/material-service.js`: Handles all Supabase interactions related to materials (fetching, creating, updating, deleting, and reassigning).
*   `js/services/registration-service.js`: Manages Supabase interactions for student registrations, including loading schedules, checking for duplicates, and submitting new registrations.
*   `js/services/schedule-service.js`: Handles all Supabase interactions related to class schedules (fetching, creating, updating, and deleting).
*   `js/services/teacher-service.js`: Handles all Supabase interactions related to teachers (fetching, creating, updating, and reassigning).

### js/ui/ (General UI Utilities)
*   `js/ui/dropdowns.js`: Implements custom dropdown functionality for form select elements.
*   `js/ui/modals.js`: Defines various modal classes (e.g., success, warning, duplicate) used across the application.

## pages/ (HTML Pages)
*   `pages/admin.html`: The HTML structure for the student administration dashboard.
*   `pages/centers.html`: The HTML structure for the center management page.
*   `pages/schedule-admin.html`: The HTML structure for the schedule administration dashboard.

## sql/ (Database SQL Scripts)
*   `sql/schema.sql`: SQL script to define the entire PostgreSQL database schema, including tables, types, and RPC functions for safe deletions.
*   `sql/security.sql`: SQL script to define Row Level Security (RLS) policies for all database tables.

## templates/ (HTML Templates)
*   `templates/student-report-template.html`: HTML template used by the PDF printer feature to structure student reports.
