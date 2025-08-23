# Composite Components

This directory contains unified, variant-based components that consolidate duplicate functionality across the application. Following the **enhancement-first methodology** from the architecture blueprint, these components replace multiple specialized components with single, configurable solutions.

## Component Overview

### 🎴 PatternCard

**Status**: ✅ Complete  
**Consolidates**: `marketplace/PatternCard.tsx`, `social/PatternCard.tsx`  
**Variants**: marketplace, social, library, mobile

Unified pattern display component with context-aware configuration. Handles all pattern display needs across marketplace, social feeds, and library views.

```tsx
import { PatternCard } from "./PatternCard";

// Marketplace usage
<PatternCard variant="marketplace" pattern={pattern} onPlay={handlePlay} />

// Social usage
<PatternCard variant="social" pattern={pattern} onLike={handleLike} />
```

### 🔍 FilterSystem

**Status**: ✅ Complete  
**Consolidates**: `marketplace/CategoryFilter.tsx`, `marketplace/QuickFilters.tsx`, `marketplace/SearchBar.tsx`  
**Variants**: marketplace, social, session, minimal

Unified filtering system that provides category filtering, quick filters, search, and sorting capabilities across different contexts.

```tsx
import { FilterSystem } from "./FilterSystem";

// Marketplace filtering
<FilterSystem
  variant="marketplace"
  categoryFilter={{ categories, selectedCategory, onCategoryChange }}
  quickFilter={{ filters, selectedFilters, onFilterToggle }}
  searchFilter={{ query, onQueryChange }}
/>;
```

### 🎮 SessionControls

**Status**: ✅ Complete  
**Consolidates**: `session/SessionControls.tsx`, `session/SessionControlsBar.tsx`, `session/SessionProgressDisplay.tsx`  
**Variants**: full, minimal, mobile, floating

Unified session control interface that adapts to different contexts and device types. Provides play/pause controls, progress tracking, and session metrics display.

```tsx
import { SessionControls } from "./SessionControls";

// Full desktop controls
<SessionControls
  variant="full"
  sessionState={state}
  metrics={metrics}
  onPlay={handlePlay}
  onPause={handlePause}
/>

// Mobile controls
<SessionControls variant="mobile" sessionState={state} />

// Floating controls
<SessionControls variant="floating" sessionState={state} />
```

## Architecture Principles

### 🎯 Enhancement-First Methodology

Each composite component enhances existing functionality rather than replacing it entirely:

- **Backward compatibility** through wrapper components
- **Gradual migration** with legacy component support
- **Progressive enhancement** of features and capabilities

### 🔧 Variant-Based Configuration

Components use a variant system for different contexts:

- **Base variants** for common use cases
- **Custom configurations** for specific needs
- **Layout adaptations** for responsive design

### 🧩 Composition Patterns

Components follow consistent composition patterns:

- **Props-based configuration** for variants
- **Render props** for custom content
- **Slot-based composition** for flexible layouts

## Implementation Guidelines

### Creating New Composite Components

1. **Identify Duplication**: Find 2+ components with similar functionality
2. **Extract Common Interface**: Define unified props and configuration
3. **Create Variant System**: Design variants for different contexts
4. **Maintain Compatibility**: Create wrapper components for migration
5. **Document Usage**: Provide clear examples and migration guides

### Directory Structure

```
composite/
├── ComponentName/
│   ├── ComponentName.tsx     # Main component
│   ├── types.ts             # Type definitions
│   ├── variants.ts          # Variant configurations
│   └── index.ts             # Clean exports
└── README.md                # This file
```

### Migration Strategy

When consolidating existing components:

1. **Create composite component** with all required variants
2. **Update existing components** to use composite internally
3. **Maintain exports** for backward compatibility
4. **Gradual migration** of usage throughout the app
5. **Eventual removal** of old components when fully migrated

## Benefits

- ✅ **Reduced duplication** across the codebase
- ✅ **Consistent behavior** across different contexts
- ✅ **Easier maintenance** with centralized logic
- ✅ **Better testing** with unified test suites
- ✅ **Improved performance** through code consolidation
- ✅ **Enhanced developer experience** with clear APIs

## Future Enhancements

Components planned for composite consolidation:

- **LoadingStates**: Unify loading indicators across contexts
- **ResultsDisplay**: Consolidate result list patterns
- **ActionButtons**: Unify action button patterns
- **ModalSystem**: Consolidate modal and dialog patterns

---

_This architecture follows the principles outlined in `ARCHITECTURE_BLUEPRINT.md` and supports the app's evolution toward a more maintainable and scalable component system._
