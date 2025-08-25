import React, { useState, useEffect, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  BreathingPhase,
  CustomBreathingPhase,
} from "../../lib/breathingPatterns";
import { useSession } from "../../hooks/useSession";
import { CustomPattern } from "../../lib/patternStorage";

interface PatternBuilderProps {
  onSave: (pattern: CustomPattern) => void;
  existingPattern?: CustomPattern;
}

const defaultPhase: CustomBreathingPhase = {
  name: "inhale",
  duration: 4,
  text: "Breathe in deeply",
};

const PatternBuilder: React.FC<PatternBuilderProps> = ({
  onSave,
  existingPattern,
}) => {
  const [pattern, setPattern] = useState<CustomPattern>({
    id: existingPattern?.id || Date.now().toString(),
    name: existingPattern?.name || "",
    description: existingPattern?.description || "",
    phases: existingPattern?.phases || [defaultPhase],
    category: existingPattern?.category || "stress",
    difficulty: existingPattern?.difficulty || "beginner",
    duration: existingPattern?.duration || 0,
    creator: existingPattern?.creator || "user-id-placeholder",
  });

  const { isActive, start, complete } = useSession();

  const calculateDuration = useCallback(() => {
    const totalDuration = pattern.phases.reduce(
      (sum, phase) => sum + phase.duration,
      0
    );
    setPattern((prev) => ({ ...prev, duration: totalDuration }));
  }, [pattern.phases]);

  useEffect(() => {
    calculateDuration();
  }, [calculateDuration]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newPhases = Array.from(pattern.phases);
    const [reorderedItem] = newPhases.splice(result.source.index, 1);
    newPhases.splice(result.destination.index, 0, reorderedItem);

    setPattern((prev) => ({ ...prev, phases: newPhases }));
  };

  const addPhase = (name: CustomBreathingPhase["name"]) => {
    const newPhase: CustomBreathingPhase = {
      name,
      duration: 4,
      text:
        name === "inhale"
          ? "Breathe in deeply"
          : name === "exhale"
          ? "Breathe out slowly"
          : "Hold your breath",
    };
    setPattern((prev) => ({ ...prev, phases: [...prev.phases, newPhase] }));
  };

  const updatePhase = (
    index: number,
    field: keyof CustomBreathingPhase,
    value: string | number
  ) => {
    const newPhases = [...pattern.phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setPattern((prev) => ({ ...prev, phases: newPhases }));
  };

  const removePhase = (index: number) => {
    setPattern((prev) => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index),
    }));
  };

  const handlePreview = () => {
    if (isActive) {
      complete();
    } else {
      start();
    }
  };

  const handleSave = () => {
    onSave(pattern);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Breathing Pattern Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Pattern Name
            </label>
            <Input
              value={pattern.name}
              onChange={(e) =>
                setPattern((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Morning Calm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              value={pattern.description}
              onChange={(e) =>
                setPattern((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the purpose and benefits of this pattern"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={pattern.category}
                onChange={(e) =>
                  setPattern((prev) => ({
                    ...prev,
                    category: e.target.value as
                      | "stress"
                      | "sleep"
                      | "energy"
                      | "focus",
                  }))
                }
                className="w-full p-2 border rounded"
              >
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
                value={pattern.difficulty}
                onChange={(e) =>
                  setPattern((prev) => ({
                    ...prev,
                    difficulty: e.target.value as
                      | "beginner"
                      | "intermediate"
                      | "advanced",
                  }))
                }
                className="w-full p-2 border rounded"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Total Duration (s)
              </label>
              <Input
                value={pattern.duration}
                readOnly
                className="bg-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pattern Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="phases">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {pattern.phases.map((phase, index) => (
                    <Draggable
                      key={index}
                      draggableId={`phase-${index}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-4 border rounded-lg bg-white shadow-sm"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium capitalize">
                              {phase.name}
                            </span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removePhase(index)}
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-sm">
                                Duration (seconds)
                              </label>
                              <Input
                                type="number"
                                value={phase.duration}
                                onChange={(e) =>
                                  updatePhase(
                                    index,
                                    "duration",
                                    parseInt(e.target.value)
                                  )
                                }
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="text-sm">Guidance Text</label>
                              <Input
                                value={phase.text}
                                onChange={(e) =>
                                  updatePhase(index, "text", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => addPhase("inhale")}>
              Add Inhale
            </Button>
            <Button variant="outline" onClick={() => addPhase("exhale")}>
              Add Exhale
            </Button>
            <Button variant="outline" onClick={() => addPhase("hold")}>
              Add Hold
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={handlePreview}
          variant={isActive ? "destructive" : "secondary"}
        >
          {isActive ? "Stop Preview" : "Preview Pattern"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!pattern.name || pattern.phases.length === 0}
        >
          Save Pattern
        </Button>
      </div>
    </div>
  );
};

export default PatternBuilder;
