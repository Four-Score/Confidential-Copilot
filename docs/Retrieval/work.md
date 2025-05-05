# Retrieval Flow Documentation

## Overview

The retrieval flow implements a secure and intuitive interface for users to search through their ingested documents. The system enables users to select specific projects and documents for targeted searches, supporting both encrypted and unencrypted content sources. The implementation follows a modular design that can be integrated across different application modes.

### Core Requirements

1. **Modal-Based Flow**: Create a non-intrusive, step-by-step dialog flow rather than full-page routes
2. **Three-Step Process**: Project selection → Document selection → Search interface
3. **Data Type Support**: Handle both encrypted documents (PDFs) and unencrypted documents (websites)
4. **Reusable Architecture**: Design the system to be reused across different application modes
5. **State Management**: Maintain selections across components with persistence

## Dashboard Integration

### Dashboard UI Components

#### src\components\dashboard\ModeCard.tsx
A reusable card component for displaying interaction modes (Chat, Email, Meeting, Document). Features include:
- Icon, title, and description display
- Hover animations with translation and shadow effects
- Clickable functionality with smooth transitions
- Props: `icon`, `title`, `description`, `onClick`

#### src\components\dashboard\ModesContainer.tsx
Container component that organizes multiple `ModeCard` components in a responsive grid layout:
- Accepts an array of mode data through the `modes` prop
- Renders each mode as a card
- Implements responsive grid that adjusts from 1 to 4 columns based on viewport size
- Includes a section title and consistent spacing

#### src\components\dashboard\page.tsx
Main dashboard page that integrates the mode cards and retrieval button:
- Implements `handleRetrievalClick` function to initiate the retrieval flow
- Defines mode data for Chat, Email, Meeting, and Document cards
- Positions retrieval button discretely in the corner for testing
- Integrates with `useModal` hook to launch the modal flow

## Modal System

### Core Components

#### src\components\ui\Modal.tsx
Base modal component with accessibility and animation features:
- Creates a React portal for proper DOM placement
- Implements backdrop overlay with click-outside closing
- Provides customizable width options: sm, md, lg, xl, full
- Includes focus trapping for keyboard navigation
- Handles escape key press for closing
- Prevents background scrolling when open
- Uses ARIA attributes for accessibility compliance

#### globals.css
Global CSS with modal animation classes:
- `fadeIn`/`fadeOut` animations for overlay transitions
- `slideIn`/`slideOut` animations for modal content
- Directional slide animations for modal navigation (left/right)
- Timing coordination for smooth transitions

### Animation System

#### transitions.module.css
CSS module for modal transition animations:
- `slideInRight`/`slideOutLeft` animations for forward navigation
- `slideInLeft`/`slideOutRight` animations for backward navigation
- Animation keyframes with translation and opacity changes
- Container positioning classes

#### src\components\ui\ModalTransition.tsx
Component that applies directional animations to modal content:
- Uses `animationDirection` and `isAnimating` states from ModalContext
- Determines appropriate animation class based on navigation direction
- Conditionally renders children with animation classes
- Supports forward and backward transitions

### Navigation System

#### src\constants\modalRoutes.ts
Constants file defining standard route names for modal navigation:
- `PROJECT_SELECTION`: First step for selecting a project
- `DATA_SELECTION`: Second step for selecting documents
- `SEARCH_INTERFACE`: Final step for searching selected documents
- Used throughout the application for route consistency

## State Management

### Context Providers

#### src\contexts\ModalContext.tsx
Context for managing modal state throughout the application:
- `currentModal`: Tracks active modal type
- `modalProps`: Stores properties passed to modals
- `isModalOpen`: Boolean flag for modal visibility
- `isAnimating`: Tracks animation state
- `animationDirection`: Direction of animation ('forward'/'backward')
- `modalHistory`: Array of previous modals for navigation
- Functions:
  - `openModal`: Opens a modal and adds current to history
  - `closeModal`: Closes current modal and clears history
  - `goBack`: Returns to previous modal in history
  - `replaceModal`: Replaces current modal without affecting history
- Custom hook: `useModal()` for accessing modal functionality

#### src\contexts\DataSelectionContext.tsx
Context for managing selected projects and documents:
- `selectedProjectId`/`selectedProjectName`: Currently selected project
- `selectedDocuments`: Array of selected documents with their types
- Document type distinction through `DocumentSourceType` ('encrypted'/'unencrypted')
- Functions:
  - `selectProject`: Sets the current project
  - `clearProjectSelection`: Clears project selection
  - `addDocument`/`removeDocument`/`toggleDocument`: Manage document selections
  - `clearDocumentSelection`: Removes all document selections
  - `selectAllDocuments`: Selects all documents in a list
  - Utility functions: `isDocumentSelected`, `hasSelectedDocuments`
- Custom hook: `useDataSelection()` for accessing selection state

### Provider Implementation

#### src\providers\ModalProvider.tsx
Provider component that integrates the modal context with modal components:
- Combines `BaseModalProvider` and `DataSelectionProvider`
- Registers all modal components (ProjectSelectionModal, DataSelectionModal, SearchModal)
- Makes modals accessible throughout the application
- Maintains proper component hierarchy for context access

#### src\providers\DataSelectionProvider.tsx
Provider that adds persistence to the data selection context:
- Wraps `BaseDataSelectionProvider` with additional functionality
- Implements `PersistenceLayer` component for localStorage operations:
  - Loads persisted project and document selections on mount
  - Saves selections to localStorage when they change
  - Ensures data consistency across page refreshes
  - Clears document selections when no project is selected
- Prevents unnecessary re-renders through component structure

#### src\app\layout.tsx
Root layout that incorporates the modal providers:
- Wraps the entire application with `ModalProvider`
- Ensures modal and data selection functionality is available globally

### Utility Hooks

#### src\hooks\useRetrievalFlow.ts
Custom hook providing high-level functions for the retrieval flow:
- `startRetrievalFlow()`: Initiates flow from project selection
- `startDocumentSelection(projectId, projectName)`: Skips to document selection
- `startSearch(documents)`: Opens search modal with selected documents
- `resetRetrievalState()`: Clears all selections
- `getRetrievalState()`: Returns current selection state
- Combines functionality from `ModalContext` and `DataSelectionContext`
- Simplifies integration of retrieval flow into other application components

## Retrieval Flow Components

### Project Selection

#### src\hooks\useRetrievalFlow.ts
Card component for displaying selectable project information:
- Visual selection state with blue border and checkmark
- Displays project name, description, and creation date
- Props: `project`, `isSelected`, `onClick`
- Formats dates with `formatDate` function

#### src\components\retrieval\ProjectSelectionModal.tsx
Modal for selecting a project to search within:
- Reuses project fetching logic with `fetchProjects()`
- Features search functionality to filter projects by name/description
- Implements loading, error, and empty states
- Tracks selected project in state with `selectedProjectId`
- Uses `ModalTransition` for smooth animations
- "Continue" button enabled when project is selected
- Integrates with `DataSelectionContext` through `selectProject`
- Navigates to data selection using `openModal` with `MODAL_ROUTES.DATA_SELECTION`

### Document Selection

#### src\components\retrieval\SelectableDocumentCard.tsx
Card component for displaying selectable document information:
- Supports both encrypted and unencrypted document types
- Automatically decrypts document names using `keyManagementService.decryptMetadata()`
- Features visual selection state with checkbox
- Displays document metadata: type, upload date, file size, page count
- Shows favicon for website documents using Google's favicon service
- Type-specific indicators for encrypted/unencrypted sources
- Integrates with `DataSelectionContext` through `isDocumentSelected` and `toggleDocument`
- Handles document type icons with `getDocumentIcon`

#### src\components\retrieval\DataSelectionModal.tsx
Modal for selecting documents within a project:
- Header with back button, project name, and close button
- "Select All" checkbox for bulk selection
- Document counter showing number of selected items
- Fetches data from multiple sources:
  - `/api/projects/${selectedProjectId}/documents` for encrypted PDFs
  - `/api/projects/${selectedProjectId}/websites` for unencrypted websites
- Handles both document types with separate sections
- Implements loading, error, and empty states
- Vertical scrolling with fixed header and footer
- "Search Selected Documents" button enabled when at least one document is selected
- Back navigation using `goBack` function
- Forward navigation using `openModal` with `MODAL_ROUTES.SEARCH_INTERFACE`

### Search Interface

#### src\components\retrieval\SearchModal.tsx
Modal for searching across selected documents:
- Search input field with validation
- Search button with loading state
- Empty state messaging for initial view
- Visual feedback during search operations
- Separates selected documents by type for vector search preparation:
  - Encrypted document IDs for `match_document_chunks` function (to be implemented)
  - Unencrypted document IDs for `match_v2_document_chunks` function (to be implemented)
- Back navigation using `goBack` function
- Logs search parameters for future implementation
- Prepares structure for vector search integration

## Documentation

This implementation creates a complete retrieval flow system that guides users through project selection, document selection, and search initiation. The modular design allows for reuse across different application modes, while the context-based state management ensures selections persist throughout the flow and across page refreshes. The system handles both encrypted and unencrypted document types, preparing document IDs for use with the appropriate vector search functions to be implemented in the future. 