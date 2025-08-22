# Hook Migration Map - Aggressive Cleanup

## Deleted Hooks → Replacement

| Deleted Hook               | Replacement                   | Import Path                          |
| -------------------------- | ----------------------------- | ------------------------------------ |
| `useEnhancedSession`       | `useSession`                  | `../../hooks/useSession`             |
| `useBreathingSession`      | `useSession`                  | `../../hooks/useSession`             |
| `useOptimizedVision`       | `useMeditationVision`         | `../../hooks/useMeditationVision`    |
| `useMobileOptimization`    | `useAdaptivePerformance`      | `../../hooks/useAdaptivePerformance` |
| `useSessionInitialization` | Direct session initialization | Remove import                        |

## Method Mapping

### useEnhancedSession → useSession

- `state` → `phase`
- `isActive` → `isActive`
- `isPaused` → `isPaused`
- `start()` → `start()`
- `pause()` → `pause()`
- `resume()` → `resume()`
- `complete()` → `complete()`
- `getSessionDuration()` → `getSessionDuration()`

### useMobileOptimization → useAdaptivePerformance

- `state.isMobile` → `isMobile`
- `state.isTablet` → `isTablet`
- `state.orientation` → Use CSS media queries instead
- `applyPerformanceOptimizations()` → Handled automatically

## Files to Update

- All files importing deleted hooks need immediate update
