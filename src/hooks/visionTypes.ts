/**
 * Vision-related type definitions
 */

export type TrackingStatus = "IDLE" | "INITIALIZING" | "TRACKING" | "ERROR";

export type Keypoint = {
  x: number;
  y: number;
  score?: number;
  name?: string;
};