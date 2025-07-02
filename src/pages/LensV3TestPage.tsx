import React from "react";
import { LensV3Test } from "@/components/LensV3Test";

const LensV3TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lens V3 SDK Testing Suite
          </h1>
          <p className="text-lg text-gray-600">
            Testing and exploring Lens Protocol V3 SDK functionality
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>
              This page is for development purposes to understand V3 SDK
              patterns
            </p>
            <p>
              Use the buttons below to test different aspects of the Lens V3
              integration
            </p>
          </div>
        </div>

        <LensV3Test />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            App Address:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              DF7gzk-zW-C24tTtRamHCwj8VCuSZ40erZ
            </code>
          </p>
          <p className="mt-2">
            SDK Version:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              @lens-protocol/client
            </code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LensV3TestPage;
