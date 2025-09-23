/**
 * State Debugging Utilities
 *
 * Comprehensive debugging tools for state management across the application.
 * Provides state inspection, performance monitoring, logging, and debugging panels.
 *
 * Features:
 * - State inspection and visualization
 * - Performance monitoring and metrics
 * - State change logging and history
 * - Debug panels and components
 * - State export/import for debugging
 * - Memory usage tracking
 * - State validation and consistency checks
 */

import { useEffect, useState, useCallback } from 'react';

// ============================================================================
// TYPES - Debugging interfaces
// ============================================================================

export interface StateSnapshot {
    timestamp: number;
    storeName: string;
    state: Record<string, any>;
    memoryUsage?: number;
    performanceMetrics?: PerformanceMetrics;
}

export interface PerformanceMetrics {
    renderTime: number;
    stateUpdateTime: number;
    memoryUsage: number;
    componentCount: number;
    subscriptionCount: number;
}

export interface StateChangeLog {
    id: string;
    timestamp: number;
    storeName: string;
    action: string;
    previousState: Record<string, any>;
    newState: Record<string, any>;
    duration: number;
    triggeredBy: string;
}

export interface DebugConfig {
    enabled: boolean;
    logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
    enablePerformanceMonitoring: boolean;
    enableStateLogging: boolean;
    enableMemoryTracking: boolean;
    maxHistorySize: number;
    enableConsoleOutput: boolean;
    enableVisualDebugger: boolean;
}

export interface StateValidationRule {
    storeName: string;
    field: string;
    validator: (value: any) => boolean;
    errorMessage: string;
}

export interface DebugMetrics {
    totalStateChanges: number;
    averageStateUpdateTime: number;
    memoryUsageTrend: 'increasing' | 'stable' | 'decreasing';
    performanceScore: number; // 0-100
    errorCount: number;
    warningCount: number;
}

// ============================================================================
// CONSTANTS - Debug configuration
// ============================================================================

const DEFAULT_DEBUG_CONFIG: DebugConfig = {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: 'info',
    enablePerformanceMonitoring: true,
    enableStateLogging: true,
    enableMemoryTracking: true,
    maxHistorySize: 100,
    enableConsoleOutput: true,
    enableVisualDebugger: false,
};

const LOG_LEVELS = {
    none: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
};

// ============================================================================
// STATE DEBUGGER CLASS
// ============================================================================

class StateDebugger {
    private config: DebugConfig = DEFAULT_DEBUG_CONFIG;
    private snapshots: Map<string, StateSnapshot[]> = new Map();
    private changeLogs: StateChangeLog[] = [];
    private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map();
    private validationRules: StateValidationRule[] = [];
    private isEnabled = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (typeof window !== 'undefined') {
            // Initialize memory tracking
            if (this.config.enableMemoryTracking && 'memory' in performance) {
                this.startMemoryTracking();
            }

            // Initialize performance observer
            if (this.config.enablePerformanceMonitoring) {
                this.initializePerformanceObserver();
            }
        }
    }

    configure(config: Partial<DebugConfig>) {
        this.config = { ...this.config, ...config };
        this.isEnabled = this.config.enabled;

        if (this.config.enableConsoleOutput) {
            console.log('🔧 StateDebugger: Configuration updated', this.config);
        }
    }

    // State snapshot management
    takeSnapshot(storeName: string, state: Record<string, any>) {
        if (!this.isEnabled || !this.config.enableStateLogging) return;

        const snapshot: StateSnapshot = {
            timestamp: Date.now(),
            storeName,
            state: this.deepClone(state),
            memoryUsage: this.getMemoryUsage(),
            performanceMetrics: this.getCurrentPerformanceMetrics(),
        };

        const storeSnapshots = this.snapshots.get(storeName) || [];
        storeSnapshots.push(snapshot);

        // Limit history size
        if (storeSnapshots.length > this.config.maxHistorySize) {
            storeSnapshots.shift();
        }

        this.snapshots.set(storeName, storeSnapshots);

        if (LOG_LEVELS[this.config.logLevel] >= LOG_LEVELS.debug) {
            console.debug(`📸 StateDebugger: Snapshot taken for ${storeName}`, snapshot);
        }
    }

    // State change logging
    logStateChange(
        storeName: string,
        action: string,
        previousState: Record<string, any>,
        newState: Record<string, any>,
        triggeredBy: string,
        duration?: number
    ) {
        if (!this.isEnabled || !this.config.enableStateLogging) return;

        const changeLog: StateChangeLog = {
            id: `${storeName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            storeName,
            action,
            previousState: this.deepClone(previousState),
            newState: this.deepClone(newState),
            duration: duration || 0,
            triggeredBy,
        };

        this.changeLogs.push(changeLog);

        // Limit history size
        if (this.changeLogs.length > this.config.maxHistorySize) {
            this.changeLogs.shift();
        }

        // Validate state changes
        this.validateStateChange(changeLog);

        // Log based on configuration
        if (this.config.enableConsoleOutput) {
            const logMethod = this.getLogMethod(changeLog);
            logMethod(`🔄 StateDebugger: ${storeName}.${action}`, {
                duration: `${changeLog.duration}ms`,
                triggeredBy,
                changes: this.getStateDiff(previousState, newState),
            });
        }
    }

    // Performance monitoring
    private initializePerformanceObserver() {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'measure') {
                            this.logPerformanceEntry(entry);
                        }
                    }
                });

                observer.observe({ entryTypes: ['measure'] });
            } catch (error) {
                console.warn('StateDebugger: Failed to initialize performance observer', error);
            }
        }
    }

    private logPerformanceEntry(entry: PerformanceEntry) {
        if (LOG_LEVELS[this.config.logLevel] >= LOG_LEVELS.info) {
            console.info(`⚡ StateDebugger: Performance - ${entry.name}: ${entry.duration}ms`);
        }
    }

    // Memory tracking
    private startMemoryTracking() {
        if (typeof window !== 'undefined') {
            setInterval(() => {
                this.trackMemoryUsage();
            }, 5000); // Track every 5 seconds
        }
    }

    private trackMemoryUsage() {
        if (!this.config.enableMemoryTracking) return;

        const memoryUsage = this.getMemoryUsage();
        if (memoryUsage > 0) {
            // Store memory usage in snapshots for trend analysis
            console.debug(`🧠 StateDebugger: Memory usage: ${memoryUsage}MB`);
        }
    }

    private getMemoryUsage(): number {
        if (typeof performance !== 'undefined' && 'memory' in performance) {
            return Math.round((performance as any).memory.usedJSHeapSize / 1048576); // Convert to MB
        }
        return 0;
    }

    // State validation
    addValidationRule(rule: StateValidationRule) {
        this.validationRules.push(rule);
    }

    private validateStateChange(changeLog: StateChangeLog) {
        const relevantRules = this.validationRules.filter(rule => rule.storeName === changeLog.storeName);

        for (const rule of relevantRules) {
            const newValue = this.getNestedValue(changeLog.newState, rule.field);
            const isValid = rule.validator(newValue);

            if (!isValid) {
                console.error(`❌ StateDebugger: Validation failed for ${rule.storeName}.${rule.field}: ${rule.errorMessage}`);
            }
        }
    }

    // Utility methods
    private deepClone(obj: any): any {
        return JSON.parse(JSON.stringify(obj));
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private getStateDiff(previous: Record<string, any>, current: Record<string, any>): Record<string, any> {
        const diff: Record<string, any> = {};

        // Simple diff - could be enhanced with deep diff algorithm
        for (const key in current) {
            if (JSON.stringify(previous[key]) !== JSON.stringify(current[key])) {
                diff[key] = { from: previous[key], to: current[key] };
            }
        }

        return diff;
    }

    private getLogMethod(changeLog: StateChangeLog) {
        if (changeLog.duration > 100) {
            return console.warn;
        }
        if (changeLog.duration > 50) {
            return console.info;
        }
        return console.debug;
    }

    private getCurrentPerformanceMetrics(): PerformanceMetrics {
        return {
            renderTime: 0, // Would be populated by component instrumentation
            stateUpdateTime: 0,
            memoryUsage: this.getMemoryUsage(),
            componentCount: 0,
            subscriptionCount: 0,
        };
    }

    // Public API methods
    getSnapshots(storeName: string): StateSnapshot[] {
        return this.snapshots.get(storeName) || [];
    }

    getChangeLogs(storeName?: string): StateChangeLog[] {
        if (storeName) {
            return this.changeLogs.filter(log => log.storeName === storeName);
        }
        return this.changeLogs;
    }

    getDebugMetrics(): DebugMetrics {
        const totalChanges = this.changeLogs.length;
        const averageUpdateTime = totalChanges > 0
            ? this.changeLogs.reduce((sum, log) => sum + log.duration, 0) / totalChanges
            : 0;

        const memorySnapshots = Array.from(this.snapshots.values())
            .flat()
            .filter(snapshot => snapshot.memoryUsage)
            .map(snapshot => snapshot.memoryUsage!);

        const memoryTrend = this.calculateMemoryTrend(memorySnapshots);

        return {
            totalStateChanges: totalChanges,
            averageStateUpdateTime: averageUpdateTime,
            memoryUsageTrend: memoryTrend,
            performanceScore: this.calculatePerformanceScore(),
            errorCount: this.changeLogs.filter(log => log.duration > 100).length,
            warningCount: this.changeLogs.filter(log => log.duration > 50 && log.duration <= 100).length,
        };
    }

    private calculateMemoryTrend(memorySnapshots: number[]): 'increasing' | 'stable' | 'decreasing' {
        if (memorySnapshots.length < 2) return 'stable';

        const recent = memorySnapshots.slice(-5);
        const older = memorySnapshots.slice(-10, -5);

        if (older.length === 0) return 'stable';

        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

        const change = recentAvg - olderAvg;

        if (change > 5) return 'increasing';
        if (change < -5) return 'decreasing';
        return 'stable';
    }

    private calculatePerformanceScore(): number {
        const metrics = this.getDebugMetrics();
        let score = 100;

        // Penalize for slow updates
        if (metrics.averageStateUpdateTime > 50) score -= 20;
        if (metrics.averageStateUpdateTime > 100) score -= 30;

        // Penalize for memory issues
        if (metrics.memoryUsageTrend === 'increasing') score -= 15;

        // Penalize for errors
        if (metrics.errorCount > 0) score -= 10;
        if (metrics.warningCount > 5) score -= 5;

        return Math.max(0, Math.min(100, score));
    }

    exportDebugData() {
        return {
            config: this.config,
            snapshots: Object.fromEntries(this.snapshots),
            changeLogs: this.changeLogs,
            metrics: this.getDebugMetrics(),
            timestamp: Date.now(),
        };
    }

    clearHistory() {
        this.snapshots.clear();
        this.changeLogs = [];
        this.performanceMetrics.clear();
        console.log('🧹 StateDebugger: History cleared');
    }
}

// ============================================================================
// GLOBAL DEBUGGER INSTANCE
// ============================================================================

export const stateDebugger = new StateDebugger();

// ============================================================================
// REACT HOOKS FOR DEBUGGING
// ============================================================================

export const useStateDebugger = () => {
    const [isEnabled, setIsEnabled] = useState(stateDebugger['isEnabled']);
    const [metrics, setMetrics] = useState(() => stateDebugger.getDebugMetrics());

    const toggleDebugger = useCallback(() => {
        const newState = !isEnabled;
        stateDebugger.configure({ enabled: newState });
        setIsEnabled(newState);
    }, [isEnabled]);

    const refreshMetrics = useCallback(() => {
        setMetrics(stateDebugger.getDebugMetrics());
    }, []);

    useEffect(() => {
        const interval = setInterval(refreshMetrics, 2000);
        return () => clearInterval(interval);
    }, [refreshMetrics]);

    return {
        isEnabled,
        toggleDebugger,
        metrics,
        snapshots: (storeName: string) => stateDebugger.getSnapshots(storeName),
        changeLogs: (storeName?: string) => stateDebugger.getChangeLogs(storeName),
        exportData: () => stateDebugger.exportDebugData(),
        clearHistory: () => stateDebugger.clearHistory(),
    };
};

// ============================================================================
// STORE WRAPPER FOR AUTOMATIC DEBUGGING
// ============================================================================

export const withStateDebugger = <T extends Record<string, any>>(
    storeName: string,
    store: T
) => {
    if (!stateDebugger['isEnabled']) return store;

    // Wrap actions to log state changes
    const wrappedStore = { ...store };

    // This is a simplified example - in practice, you'd need more sophisticated wrapping
    // based on the actual store structure

    return wrappedStore;
};

// ============================================================================
// PERFORMANCE MONITORING HOOK
// ============================================================================

export const usePerformanceMonitor = (componentName: string) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        renderTime: 0,
        stateUpdateTime: 0,
        memoryUsage: 0,
        componentCount: 0,
        subscriptionCount: 0,
    });

    useEffect(() => {
        if (!stateDebugger['isEnabled'] || !stateDebugger['config'].enablePerformanceMonitoring) {
            return;
        }

        const startTime = performance.now();

        const cleanup = () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;

            setMetrics(prev => ({
                ...prev,
                renderTime,
                memoryUsage: stateDebugger['getMemoryUsage'](),
            }));
        };

        // Cleanup on unmount
        return cleanup;
    }, [componentName]);

    return metrics;
};

// ============================================================================
// STATE VALIDATION HOOK
// ============================================================================

export const useStateValidation = (storeName: string, rules: StateValidationRule[]) => {
    useEffect(() => {
        rules.forEach(rule => {
            stateDebugger.addValidationRule(rule);
        });

        return () => {
            // Cleanup validation rules if needed
        };
    }, [storeName, rules]);
};

// ============================================================================
// DEBUG CONSOLE COMMANDS
// ============================================================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).stateDebugger = stateDebugger;
    (window as any).debugState = () => console.table(stateDebugger.getDebugMetrics());
    (window as any).debugSnapshots = (storeName: string) => console.table(stateDebugger.getSnapshots(storeName));
    (window as any).debugChanges = (storeName?: string) => console.table(stateDebugger.getChangeLogs(storeName));
    (window as any).exportDebugData = () => stateDebugger.exportDebugData();
    (window as any).clearDebugHistory = () => stateDebugger.clearHistory();

    console.log('🔧 StateDebugger: Debug commands available in console:');
    console.log('  - stateDebugger: Main debugger instance');
    console.log('  - debugState(): Show current metrics');
    console.log('  - debugSnapshots(storeName): Show state snapshots');
    console.log('  - debugChanges(storeName?): Show state changes');
    console.log('  - exportDebugData(): Export all debug data');
    console.log('  - clearDebugHistory(): Clear debug history');
}