import { ColorEnum, tagColors } from '@/types/tag.types';
import { Badge } from 'core-react/ui';
import React from 'react';

interface TagBadgeProps {
  color?: ColorEnum | null;
  children: React.ReactNode;
}

/**
 * Pastille d'un tag (tâches ou journal). La couleur vient de l'API (ColorEnum) : le kit prévoit `$color`
 * pour ces couleurs dynamiques ; sans couleur, le badge reprend la variante neutre du thème.
 */
export const TagBadge: React.FC<TagBadgeProps> = ({ color, children }) => (
  <Badge $pill $variant="neutral" $color={color ? tagColors[color] : undefined}>
    {children}
  </Badge>
);
