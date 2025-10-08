/**
 * AI Persona Selector Component
 * 
 * Provides an intuitive interface for users to select their preferred AI coach
 * with tier-based access controls and premium features preview.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Crown, 
  Sparkles, 
  CheckCircle, 
  Lock,
  Brain,
  Heart,
  Zap,
  Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getAllPersonas, 
  getPersonasForTier, 
  getPersona,
  type AIPersona,
  type PersonaType 
} from '@/lib/ai/personas';

interface PersonaSelectorProps {
  selectedPersona?: PersonaType;
  userTier: 'free' | 'premium';
  onPersonaSelect: (persona: PersonaType) => void;
  className?: string;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersona,
  userTier,
  onPersonaSelect,
  className
}) => {
  const [availablePersonas, setAvailablePersonas] = useState<AIPersona[]>([]);
  const [allPersonas, setAllPersonas] = useState<AIPersona[]>([]);

  useEffect(() => {
    const available = getPersonasForTier(userTier);
    const all = getAllPersonas();
    setAvailablePersonas(available);
    setAllPersonas(all);
  }, [userTier]);

  const isPersonaAvailable = (persona: AIPersona) => {
    return availablePersonas.some(p => p.id === persona.id);
  };

  const getPersonaIcon = (personaId: PersonaType) => {
    const iconMap = {
      zen: Sparkles,
      dr_breathe: Brain,
      performance: Zap,
      mindful: Leaf
    };
    return iconMap[personaId] || Brain;
  };

  const PersonaCard = ({ persona }: { persona: AIPersona }) => {
    const isAvailable = isPersonaAvailable(persona);
    const isSelected = selectedPersona === persona.id;
    const IconComponent = getPersonaIcon(persona.id);

    return (
      <Card 
        className={cn(
          "relative cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected && "ring-2 ring-primary ring-offset-2",
          !isAvailable && "opacity-60",
          className
        )}
        onClick={() => isAvailable && onPersonaSelect(persona.id)}
      >
        {!isAvailable && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar 
              className={cn(
                "w-12 h-12 text-white",
                `bg-gradient-to-br ${persona.avatar.gradient}`
              )}
            >
              <AvatarFallback 
                className={cn(
                  "text-white text-lg font-bold",
                  `bg-gradient-to-br ${persona.avatar.gradient}`
                )}
              >
                {persona.avatar.emoji}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {persona.name}
                {isSelected && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {!isAvailable && (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {persona.title}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {persona.greeting}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconComponent className="w-3 h-3" />
              <span>Specializes in:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {persona.specialization.slice(0, 2).map((spec, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {persona.specialization.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{persona.specialization.length - 2} more
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Communication Style:
            </div>
            <p className="text-xs text-muted-foreground">
              {persona.personality.tone} • {persona.personality.approach}
            </p>
          </div>

          {!isAvailable && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">
                Premium Features:
              </div>
              <div className="space-y-1">
                {persona.premiumFeatures.slice(0, 2).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAvailable && !isSelected && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onPersonaSelect(persona.id);
              }}
            >
              Select {persona.name}
            </Button>
          )}

          {isSelected && (
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              disabled
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Selected
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Choose Your AI Coach</h3>
        <p className="text-sm text-muted-foreground">
          Select a specialized AI persona that matches your breathing goals and preferences.
        </p>
      </div>

      {userTier === 'free' && (
        <Alert>
          <Heart className="h-4 w-4" />
          <AlertDescription>
            <strong>Free Tier:</strong> You have access to Dr. Breathe, our scientific breathing expert. 
            Upgrade to premium to unlock all AI coaches with specialized expertise.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {allPersonas.map((persona) => (
          <PersonaCard key={persona.id} persona={persona} />
        ))}
      </div>

      {selectedPersona && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Avatar 
                className={cn(
                  "w-8 h-8 text-white",
                  `bg-gradient-to-br ${getPersona(selectedPersona).avatar.gradient}`
                )}
              >
                <AvatarFallback 
                  className={cn(
                    "text-white text-sm font-bold",
                    `bg-gradient-to-br ${getPersona(selectedPersona).avatar.gradient}`
                  )}
                >
                  {getPersona(selectedPersona).avatar.emoji}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">
                  {getPersona(selectedPersona).name} is ready to help!
                </h4>
                <p className="text-sm text-muted-foreground">
                  {getPersona(selectedPersona).signature}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonaSelector;