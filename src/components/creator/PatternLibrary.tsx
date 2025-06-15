import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  CustomPattern,
  PatternStorageService,
  PatternSearchQuery,
} from "../../lib/patternStorage";

const PatternLibrary: React.FC<{
  onSelectPattern: (pattern: CustomPattern) => void;
  userId: string;
}> = ({ onSelectPattern, userId }) => {
  const [patterns, setPatterns] = useState<CustomPattern[]>([]);
  const [searchQuery, setSearchQuery] = useState<PatternSearchQuery>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const storageService = new PatternStorageService();

  useEffect(() => {
    loadPatterns();
  }, [userId]);

  useEffect(() => {
    loadPatterns();
  }, [searchQuery]);

  const loadPatterns = async () => {
    setLoading(true);
    setError(null);
    try {
      let fetchedPatterns: CustomPattern[] = [];
      if (searchQuery.name || searchQuery.category || searchQuery.difficulty) {
        fetchedPatterns = await storageService.searchPatterns(searchQuery);
      } else {
        fetchedPatterns = await storageService.getUserPatterns(userId);
      }
      setPatterns(fetchedPatterns);
    } catch (err) {
      setError("Failed to load patterns. Please try again.");
      console.error("Error loading patterns:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (
    field: keyof PatternSearchQuery,
    value: string
  ) => {
    setSearchQuery((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Breathing Pattern Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Search by Name
              </label>
              <Input
                value={searchQuery.name || ""}
                onChange={(e) => handleSearchChange("name", e.target.value)}
                placeholder="e.g., Morning Calm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={searchQuery.category || ""}
                onChange={(e) => handleSearchChange("category", e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Categories</option>
                <option value="stress">Stress Relief</option>
                <option value="sleep">Sleep</option>
                <option value="energy">Energy</option>
                <option value="focus">Focus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Difficulty
              </label>
              <select
                value={searchQuery.difficulty || ""}
                onChange={(e) =>
                  handleSearchChange("difficulty", e.target.value)
                }
                className="w-full p-2 border rounded"
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <Button onClick={loadPatterns} disabled={loading}>
            {loading ? "Searching..." : "Refresh"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading patterns...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : patterns.length === 0 ? (
            <div className="text-center py-8">
              No patterns found. Try adjusting your search or create a new
              pattern.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patterns.map((pattern) => (
                <Card
                  key={pattern.id}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{pattern.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600 truncate">
                      {pattern.description}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>Category: {pattern.category}</span>
                      <span>Difficulty: {pattern.difficulty}</span>
                    </div>
                    <div className="text-sm">Duration: {pattern.duration}s</div>
                    <Button
                      className="w-full mt-2"
                      onClick={() => onSelectPattern(pattern)}
                    >
                      Select Pattern
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatternLibrary;
