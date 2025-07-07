import React, { useState } from "react";
import type { IPRegistrationResult } from "../lib/story/types";

/**
 * Example component demonstrating Story Protocol integration
 * for IP Asset registration using our server API
 */
const IPAssetRegistration: React.FC = () => {
  // Server API URL - using import.meta.env which works with Vite
  const API_URL = "http://localhost:3001/api";

  console.log("Using API URL:", API_URL);

  // Form state
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [inhale, setInhale] = useState<number>(4);
  const [hold, setHold] = useState<number>(7);
  const [exhale, setExhale] = useState<number>(8);
  const [rest, setRest] = useState<number>(0);
  const [creator, setCreator] = useState<string>("");
  const [tags, setTags] = useState<string>("relaxation,focus");

  // Registration result
  const [result, setResult] = useState<IPRegistrationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // API connection status
  const [apiStatus, setApiStatus] = useState({
    isConnected: false,
    network: "Story Aeneid Testnet",
    error: null as string | null,
  });

  // Check API connection on mount
  React.useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
          const data = await response.json();
          setApiStatus({
            isConnected: true,
            network: "Story Aeneid Testnet",
            error: null,
          });
        } else {
          setApiStatus({
            isConnected: false,
            network: "Unknown",
            error: "API server unreachable",
          });
        }
      } catch (error) {
        setApiStatus({
          isConnected: false,
          network: "Unknown",
          error:
            error instanceof Error ? error.message : "Failed to connect to API",
        });
      }
    };

    checkApiConnection();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiStatus.isConnected) {
      alert("API server not connected");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create breathing pattern object
      const pattern = {
        name,
        description,
        inhale,
        hold,
        exhale,
        rest,
        creator: creator || "0x0000000000000000000000000000000000000000",
        tags: tags.split(",").map((tag) => tag.trim()),
        difficulty: "beginner",
        category: "breathing",
      };

      // Create the request to our server API
      const response = await fetch(`${API_URL}/ip-assets/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pattern,
          licenseType: "nonCommercial",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const registrationResult = await response.json();
      setResult(registrationResult);
    } catch (error) {
      console.error("Error registering IP asset:", error);
      setResult({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        Register Breathing Pattern as IP
      </h1>

      {/* API Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">
          Story Protocol API Status
        </h2>
        <p>
          <span className="font-medium">Connected:</span>{" "}
          {apiStatus.isConnected ? "✅" : "❌"}
        </p>
        <p>
          <span className="font-medium">Network:</span> {apiStatus.network}
        </p>
        {apiStatus.error && (
          <p className="text-red-500 mt-2">
            <span className="font-medium">Error:</span> {apiStatus.error}
          </p>
        )}
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pattern Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pattern Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>

        {/* Pattern Values */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inhale (seconds)
            </label>
            <input
              type="number"
              value={inhale}
              onChange={(e) => setInhale(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min={1}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hold (seconds)
            </label>
            <input
              type="number"
              value={hold}
              onChange={(e) => setHold(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exhale (seconds)
            </label>
            <input
              type="number"
              value={exhale}
              onChange={(e) => setExhale(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min={1}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rest (seconds)
            </label>
            <input
              type="number"
              value={rest}
              onChange={(e) => setRest(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min={0}
            />
          </div>
        </div>

        {/* Creator Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Creator Address
          </label>
          <input
            type="text"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="0x..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use a default address
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting || !apiStatus.isConnected}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isSubmitting || !apiStatus.isConnected
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Registering..." : "Register IP Asset"}
          </button>
        </div>
      </form>

      {/* Result Display */}
      {result && (
        <div
          className={`mt-6 p-4 rounded ${
            result.success ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <h2 className="text-lg font-semibold mb-2">
            {result.success ? "Registration Successful" : "Registration Failed"}
          </h2>

          {result.success ? (
            <>
              <p>
                <span className="font-medium">IP ID:</span> {result.ipId}
              </p>
              <p>
                <span className="font-medium">Token ID:</span> {result.tokenId}
              </p>
              <p>
                <span className="font-medium">Transaction Hash:</span>{" "}
                <a
                  href={
                    result.explorerUrl ||
                    `https://aeneid.storyscan.io/tx/${result.txHash}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {result.txHash?.slice(0, 10)}...{result.txHash?.slice(-8)}
                </a>
              </p>
            </>
          ) : (
            <p className="text-red-700">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default IPAssetRegistration;
