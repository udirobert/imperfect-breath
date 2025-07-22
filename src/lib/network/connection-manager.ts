/**
 * Connection Manager
 * 
 * Manages WebSocket connections with connection pooling, automatic reconnection,
 * and circuit breaker pattern for resilient network operations.
 */

export interface ConnectionConfig {
  url: string;
  protocols?: string[];
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  heartbeatInterval?: number;
  reconnectOnClose?: boolean;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  url: string;
  retryCount: number;
  lastError: string | null;
  connectedAt: number | null;
  lastHeartbeat: number | null;
}

export type ConnectionEventType = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'error' 
  | 'message' 
  | 'heartbeat'
  | 'retry';

export interface ConnectionEvent {
  type: ConnectionEventType;
  connection: ManagedConnection;
  data?: any;
  error?: Error;
}

/**
 * Circuit breaker states for connection health
 */
enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Circuit tripped, rejecting requests
  HALF_OPEN = 'half-open' // Testing if service is back up
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
}

/**
 * Default connection configurations
 */
const DEFAULT_CONNECTION_CONFIG: Required<ConnectionConfig> = {
  url: '',
  protocols: [],
  timeout: 10000,
  maxRetries: 5,
  retryDelay: 1000,
  maxRetryDelay: 30000,
  heartbeatInterval: 30000,
  reconnectOnClose: true,
};

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60000,
  monitoringWindow: 300000, // 5 minutes
};

/**
 * Managed WebSocket Connection with resilience features
 */
class ManagedConnection {
  private config: Required<ConnectionConfig>;
  private socket: WebSocket | null = null;
  private state: ConnectionState;
  private listeners: Set<(event: ConnectionEvent) => void> = new Set();
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private timeoutTimer: number | null = null;
  
  // Circuit breaker
  private circuitState: CircuitState = CircuitState.CLOSED;
  private circuitConfig: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG;
  private failures: number[] = []; // Timestamp of failures
  private lastCircuitOpen: number = 0;

  constructor(config: ConnectionConfig) {
    this.config = { ...DEFAULT_CONNECTION_CONFIG, ...config };
    this.state = {
      status: 'disconnected',
      url: this.config.url,
      retryCount: 0,
      lastError: null,
      connectedAt: null,
      lastHeartbeat: null,
    };
  }

  /**
   * Update connection state
   */
  private setState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Emit event to listeners
   */
  private emit(event: ConnectionEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Connection event listener error:', error);
      }
    });
  }

  /**
   * Record failure for circuit breaker
   */
  private recordFailure(): void {
    const now = Date.now();
    this.failures.push(now);
    
    // Remove failures outside monitoring window
    this.failures = this.failures.filter(
      time => now - time < this.circuitConfig.monitoringWindow
    );

    // Check if circuit should open
    if (this.failures.length >= this.circuitConfig.failureThreshold) {
      this.circuitState = CircuitState.OPEN;
      this.lastCircuitOpen = now;
      console.warn(`Circuit breaker opened for ${this.config.url}`);
    }
  }

  /**
   * Check if circuit breaker allows connection
   */
  private canConnect(): boolean {
    switch (this.circuitState) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if recovery timeout has passed
        if (Date.now() - this.lastCircuitOpen > this.circuitConfig.recoveryTimeout) {
          this.circuitState = CircuitState.HALF_OPEN;
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  /**
   * Record successful connection (reset circuit breaker)
   */
  private recordSuccess(): void {
    this.failures = [];
    this.circuitState = CircuitState.CLOSED;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(): number {
    const exponentialDelay = this.config.retryDelay * Math.pow(2, this.state.retryCount);
    const jitterDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
    return Math.min(jitterDelay, this.config.maxRetryDelay);
  }

  /**
   * Setup heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        try {
          // Send ping frame
          this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          this.setState({ lastHeartbeat: Date.now() });
          this.emit({ type: 'heartbeat', connection: this });
        } catch (error) {
          console.warn('Heartbeat failed:', error);
          this.handleError(new Error('Heartbeat failed'));
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Handle WebSocket events
   */
  private setupSocketEvents(socket: WebSocket): void {
    socket.onopen = () => {
      this.clearTimeouts();
      this.recordSuccess();
      
      this.setState({
        status: 'connected',
        retryCount: 0,
        lastError: null,
        connectedAt: Date.now(),
      });

      this.startHeartbeat();
      this.emit({ type: 'connected', connection: this });
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle pong response
        if (data.type === 'pong') {
          this.setState({ lastHeartbeat: Date.now() });
          return;
        }

        this.emit({ type: 'message', connection: this, data });
      } catch (error) {
        // Emit raw message if JSON parsing fails
        this.emit({ type: 'message', connection: this, data: event.data });
      }
    };

    socket.onclose = (event) => {
      this.stopHeartbeat();
      this.clearTimeouts();
      
      const shouldReconnect = this.config.reconnectOnClose && 
                             !event.wasClean && 
                             this.state.retryCount < this.config.maxRetries;

      this.setState({
        status: shouldReconnect ? 'reconnecting' : 'disconnected',
        connectedAt: null,
      });

      this.emit({ type: 'disconnected', connection: this });

      if (shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    socket.onerror = (event) => {
      const error = new Error(`WebSocket error: ${event.type}`);
      this.handleError(error);
    };
  }

  /**
   * Handle connection errors
   */
  private handleError(error: Error): void {
    this.recordFailure();
    this.setState({ lastError: error.message });
    this.emit({ type: 'error', connection: this, error });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const delay = this.getRetryDelay();
    this.setState({ retryCount: this.state.retryCount + 1 });

    this.emit({ type: 'retry', connection: this });

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Public API
   */

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      return;
    }

    if (!this.canConnect()) {
      throw new Error('Connection blocked by circuit breaker');
    }

    this.setState({ status: 'connecting', lastError: null });
    this.emit({ type: 'connecting', connection: this });

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.config.url, this.config.protocols);
        this.setupSocketEvents(this.socket);

        // Setup connection timeout
        this.timeoutTimer = window.setTimeout(() => {
          if (this.socket?.readyState === WebSocket.CONNECTING) {
            this.socket.close();
            const error = new Error('Connection timeout');
            this.handleError(error);
            reject(error);
          }
        }, this.config.timeout);

        // Resolve on successful connection
        const successHandler = (event: ConnectionEvent) => {
          if (event.type === 'connected' && event.connection === this) {
            this.removeEventListener(successHandler);
            this.removeEventListener(errorHandler);
            resolve();
          }
        };

        // Reject on error
        const errorHandler = (event: ConnectionEvent) => {
          if (event.type === 'error' && event.connection === this) {
            this.removeEventListener(successHandler);
            this.removeEventListener(errorHandler);
            reject(event.error);
          }
        };

        this.addEventListener(successHandler);
        this.addEventListener(errorHandler);

      } catch (error) {
        this.handleError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.clearTimeouts();

    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
    }

    this.setState({
      status: 'disconnected',
      connectedAt: null,
      retryCount: 0,
    });
  }

  /**
   * Send message
   */
  send(data: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Connection not open');
    }

    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.socket.send(message);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.status === 'connected';
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: ConnectionEvent) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: ConnectionEvent) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Cleanup connection
   */
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
  }
}

/**
 * Connection Pool Manager
 */
class ConnectionPoolManager {
  private connections: Map<string, ManagedConnection> = new Map();
  private listeners: Set<(event: ConnectionEvent) => void> = new Set();

  /**
   * Get or create connection
   */
  getConnection(url: string, config?: Partial<ConnectionConfig>): ManagedConnection {
    if (this.connections.has(url)) {
      return this.connections.get(url)!;
    }

    const connection = new ManagedConnection({ url, ...config });
    
    // Forward events to pool listeners
    connection.addEventListener((event) => {
      this.listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Connection pool listener error:', error);
        }
      });
    });

    this.connections.set(url, connection);
    return connection;
  }

  /**
   * Remove connection from pool
   */
  removeConnection(url: string): void {
    const connection = this.connections.get(url);
    if (connection) {
      connection.destroy();
      this.connections.delete(url);
    }
  }

  /**
   * Get all connections
   */
  getAllConnections(): ManagedConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Add event listener for all connections
   */
  addEventListener(listener: (event: ConnectionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Cleanup all connections
   */
  destroy(): void {
    this.connections.forEach(connection => connection.destroy());
    this.connections.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const connectionManager = new ConnectionPoolManager();

// Export classes for advanced usage
export { ManagedConnection, ConnectionPoolManager };