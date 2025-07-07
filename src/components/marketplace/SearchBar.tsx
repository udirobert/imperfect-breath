/**
 * Basic Search Bar Component
 * Simple search input with clear functionality
 */

import React, { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search breathing patterns...",
  value,
  onChange,
  onSearch,
  onClear,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    onChange("");
    if (onClear) {
      onClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
};
