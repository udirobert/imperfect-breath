import React, { useRef, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVision } from "@/hooks/useVision";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LensConnectionTest } from "@/components/social/LensConnectionTest";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera,
  Activity,
  RefreshCw,
} from "lucide-react";

const DiagnosticPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isTestingActive, setIsTestingActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [browserInfo, setBrowserInfo] = useState<string>("");

  const {
    restlessnessScore,
    landmarks,
    trackingStatus,
    isModelsLoaded,
    initializeCamera,
  } = useVision({
    videoRef,
    isTracking: isTestingActive,
  });

  // Log diagnostic information
  const addLog = (message: string) => {
    setDiagnosticLogs((prev) => [
      ...prev.slice(-10),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  useEffect(() => {
    addLog(`Tracking status changed to: ${trackingStatus}`);
  }, [trackingStatus]);

  useEffect(() => {
    addLog(`Models loaded: ${isModelsLoaded}`);
  }, [isModelsLoaded]);

  useEffect(() => {
    addLog(`Landmarks detected: ${landmarks.length} points`);
  }, [landmarks.length]);

  // Get browser and device info on mount
  useEffect(() => {
    const getBrowserInfo = () => {
      const nav = navigator;
      const info = `${nav.userAgent}`;
      setBrowserInfo(info);
      addLog(`Browser: ${info.split(" ")[0]}`);
    };

    const getCameraDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(
          (device) => device.kind === "videoinput",
        );
        setCameraDevices(cameras);
        addLog(`Found ${cameras.length} camera device(s)`);
      } catch (error) {
        addLog(`Failed to enumerate devices: ${error}`);
      }
    };

    getBrowserInfo();
    getCameraDevices();
  }, []);

  const startTest = async () => {
    try {
      addLog("Starting camera test...");

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      setIsTestingActive(true);
      await initializeCamera();

      // Wait a moment for camera to initialize
      setTimeout(() => {
        if (videoRef.current?.srcObject) {
          setCameraPermission("granted");
          addLog("✅ Camera access granted");

          // Log stream info
          const stream = videoRef.current.srcObject as MediaStream;
          const videoTrack = stream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          addLog(
            `Camera settings: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`,
          );
        } else {
          addLog("⚠️ Camera initialization incomplete");
        }
      }, 1000);
    } catch (error) {
      setCameraPermission("denied");
      const err = error as Error;
      if (err.name === "NotAllowedError") {
        addLog("❌ Camera permission denied by user");
      } else if (err.name === "NotFoundError") {
        addLog("❌ No camera device found");
      } else if (err.name === "NotReadableError") {
        addLog("❌ Camera is already in use by another application");
      } else {
        addLog(`❌ Camera error: ${err.message}`);
      }
      setIsTestingActive(false);
    }
  };

  const stopTest = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
        addLog(`Stopped ${track.kind} track`);
      });
      videoRef.current.srcObject = null;
    }
    setIsTestingActive(false);
    setCameraPermission("prompt");
    addLog("🛑 Test stopped");
  };

  const clearLogs = () => {
    setDiagnosticLogs([]);
  };

  const getStatusIcon = (status: typeof trackingStatus) => {
    switch (status) {
      case "TRACKING":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "REQUESTING_CAMERA":
        return <Camera className="w-4 h-4 text-blue-500" />;
      case "INITIALIZING":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "NO_FACE":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "ERROR":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: typeof trackingStatus) => {
    switch (status) {
      case "TRACKING":
        return "bg-green-100 text-green-800";
      case "REQUESTING_CAMERA":
        return "bg-blue-100 text-blue-800";
      case "INITIALIZING":
        return "bg-yellow-100 text-yellow-800";
      case "NO_FACE":
        return "bg-red-100 text-red-800";
      case "ERROR":
        return "bg-red-100 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Face Detection Diagnostics</h1>
        <p className="text-muted-foreground">
          Test and debug face detection functionality
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Test
            </CardTitle>
            <CardDescription>Test camera access and video feed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isTestingActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <p className="text-gray-500">Camera not active</p>
                </div>
              )}
              {isTestingActive && landmarks.length > 0 && (
                <svg className="absolute inset-0 w-full h-full">
                  {landmarks.map((point, i) => (
                    <circle
                      key={`landmark-${i}`}
                      cx={point.x}
                      cy={point.y}
                      r="2"
                      fill="cyan"
                      stroke="blue"
                      strokeWidth="0.5"
                    />
                  ))}
                </svg>
              )}
            </div>

            <div className="flex gap-2">
              {!isTestingActive ? (
                <Button onClick={startTest}>Start Camera Test</Button>
              ) : (
                <Button onClick={stopTest} variant="outline">
                  Stop Test
                </Button>
              )}
              <Button onClick={clearLogs} variant="ghost" size="sm">
                Clear Logs
              </Button>
            </div>

            <div className="space-y-2">
              <Alert>
                <AlertDescription>
                  <strong>Camera Permission:</strong> {cameraPermission}
                </AlertDescription>
              </Alert>

              {cameraDevices.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <strong>Available Cameras:</strong> {cameraDevices.length}{" "}
                    found
                    <ul className="mt-1 text-xs">
                      {cameraDevices.map((device, index) => (
                        <li key={device.deviceId} className="truncate">
                          {index + 1}. {device.label || `Camera ${index + 1}`}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detection Status Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Detection Status
            </CardTitle>
            <CardDescription>Real-time face detection metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Models Loaded</label>
                <Badge variant={isModelsLoaded ? "default" : "destructive"}>
                  {isModelsLoaded ? "✓ Loaded" : "✗ Failed"}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tracking Status</label>
                <Badge className={getStatusColor(trackingStatus)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(trackingStatus)}
                    {trackingStatus}
                  </span>
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Landmarks</label>
                <Badge variant="outline">{landmarks.length} points</Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Restlessness Score
                </label>
                <Badge variant="outline">{Math.round(restlessnessScore)}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status Messages</label>
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                {trackingStatus === "TRACKING" &&
                  "✅ Face detected and tracking"}
                {trackingStatus === "REQUESTING_CAMERA" &&
                  "📹 Requesting camera access..."}
                {trackingStatus === "INITIALIZING" &&
                  "🔄 Loading models and initializing..."}
                {trackingStatus === "NO_FACE" && "⚠️ No face detected in frame"}
                {trackingStatus === "ERROR" && "❌ Detection error occurred"}
                {trackingStatus === "IDLE" && "💤 Detection not active"}
              </div>
            </div>

            {videoRef.current && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Video Status</label>
                <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                  <div>Ready State: {videoRef.current.readyState}/4</div>
                  <div>
                    Video Size: {videoRef.current.videoWidth}x
                    {videoRef.current.videoHeight}
                  </div>
                  <div>
                    Has Stream: {videoRef.current.srcObject ? "✅" : "❌"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diagnostic Logs Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Diagnostic Logs</CardTitle>
              <CardDescription>Real-time debugging information</CardDescription>
            </div>
            <Button onClick={clearLogs} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {diagnosticLogs.length === 0 ? (
              <p className="text-gray-500">
                No logs yet. Start the camera test to see diagnostic
                information.
              </p>
            ) : (
              diagnosticLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Section */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Common Issues:</strong>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Camera permission denied - Check browser settings</li>
                <li>Models failed to load - Check internet connection</li>
                <li>Poor lighting - Adjust lighting conditions</li>
                <li>Face not centered - Position face in center of frame</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Browser Requirements:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Chrome 60+, Firefox 60+, Safari 12+</li>
                <li>• HTTPS required for camera access</li>
                <li>• WebRTC support required</li>
                <li className="text-xs">
                  Current: {browserInfo.split(" ")[0]}
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Optimal Conditions:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Good lighting on face</li>
                <li>• Face clearly visible</li>
                <li>• Minimal background movement</li>
                <li>• Stable camera position</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lens Protocol Integration Test */}
      <LensConnectionTest />
    </div>
  );
};

export default DiagnosticPage;
