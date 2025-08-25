/**
 * Phase Editor Component
 * Simple editor for breathing pattern phases
 */

import React, { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  Plus,
  GripVertical,
  Trash2,
  Play,
  Pause,
  Timer,
  AlertCircle,
} from "lucide-react";
import type { CustomBreathingPhase } from "../../lib/breathingPatterns";
import { formatDuration } from "../../lib/utils/formatters";

interface PhaseEditorProps {
  phases: CustomBreathingPhase[];
  onChange: (phases: CustomBreathingPhase[]) => void;
  onPreview?: (phases: CustomBreathingPhase[]) => void;
  errors?: Record<string, string>;
}

export const PhaseEditor: React.FC<PhaseEditorProps> = ({
  phases,
  onChange,
  onPreview,
  errors = {},
}) => {
  const [previewPhase, setPreviewPhase] = useState<number | null>(null);

  const updatePhase = (index: number, updates: Partial<CustomBreathingPhase>) => {
    const newPhases = phases.map((phase, i) =>
      i === index ? { ...phase, ...updates } : phase
    );
    onChange(newPhases);
  };

  const addPhase = () => {
    const newPhase: CustomBreathingPhase = {
      name: "inhale",
      duration: 4000,
      text: "Enter instruction here",
    };
    onChange([...phases, newPhase]);
  };

  const removePhase = (index: number) => {
    if (phases.length > 1) {
      onChange(phases.filter((_, i) => i !== index));
    }
  };

  const duplicatePhase = (index: number) => {
    const phaseToDuplicate = phases[index];
    const duplicatedPhase: CustomBreathingPhase = {
      ...phaseToDuplicate,
      name: phaseToDuplicate.name,
    };
    const newPhases = [...phases];
    newPhases.splice(index + 1, 0, duplicatedPhase);
    onChange(newPhases);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(phases);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  const getTotalDuration = () => {
    return phases.reduce((total, phase) => total + (phase.duration || 0), 0);
  };

  // Using consolidated formatters from utils

  const handlePreviewPhase = (index: number) => {
    if (previewPhase === index) {
      setPreviewPhase(null);
    } else {
      setPreviewPhase(index);
      // In a real implementation, you'd trigger audio/visual feedback here
      setTimeout(() => setPreviewPhase(null), phases[index].duration * 1000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Breathing Phases</h3>
          <p className="text-sm text-muted-foreground">
            Define the breathing sequence and timing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            Total: {formatDuration(getTotalDuration())}
          </Badge>
          <Button onClick={addPhase} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Phase
          </Button>
        </div>
      </div>

      {/* Error message */}
      {errors.phases && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{errors.phases}</span>
        </div>
      )}

      {/* Phase List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="phases">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {phases.map((phase, index) => (
                <Draggable
                  key={index}
                  draggableId={`phase-${index}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${snapshot.isDragging ? "shadow-lg" : ""} ${
                        previewPhase === index ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Drag handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="mt-6 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>

                          {/* Phase number */}
                          <div className="mt-6">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                          </div>

                          {/* Phase content */}
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`phase-name-${index}`}>
                                  Phase Name
                                </Label>
                                <Input
                                  id={`phase-name-${index}`}
                                  value={phase.name}
                                  onChange={(e) =>
                                    updatePhase(index, { name: e.target.value as any })
                                  }
                                  placeholder="e.g., Inhale"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`phase-duration-${index}`}>
                                  Duration (seconds)
                                </Label>
                                <Input
                                  id={`phase-duration-${index}`}
                                  type="number"
                                  min="1"
                                  max="60"
                                  value={phase.duration}
                                  onChange={(e) =>
                                    updatePhase(index, {
                                      duration: parseInt(e.target.value) || 1,
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`phase-instruction-${index}`}>
                                Instruction
                              </Label>
                              <Textarea
                                id={`phase-instruction-${index}`}
                                value={phase.text || ""}
                                onChange={(e) =>
                                  updatePhase(index, {
                                    text: e.target.value,
                                  })
                                }
                                placeholder="Describe what the user should do during this phase..."
                                rows={2}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewPhase(index)}
                              className="w-full"
                            >
                              {previewPhase === index ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicatePhase(index)}
                              className="w-full"
                            >
                              Copy
                            </Button>
                            {phases.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removePhase(index)}
                                className="w-full text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Preview Controls */}
      {onPreview && (
        <div className="flex items-center justify-center pt-4 border-t">
          <Button onClick={() => onPreview(phases)} variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Preview Full Sequence
          </Button>
        </div>
      )}

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span>
              <strong>{phases.length}</strong> phase
              {phases.length !== 1 ? "s" : ""}
            </span>
            <span>
              Total cycle: <strong>{formatDuration(getTotalDuration())}</strong>
            </span>
            <span>
              Average phase:{" "}
              <strong>
                {formatDuration(Math.round(getTotalDuration() / phases.length))}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
