<?php

namespace App\Enum;

/**
 * Onglets du journal côté API (paramètre ?tab=).
 * L'onglet « Tags » du front n'a pas d'équivalent ici : il utilise /api/journal/tags.
 */
enum JournalTabEnum: string
{
    case Feed = 'feed';
    case Memories = 'memories';
    case Bookmarks = 'bookmarks';
    case Private = 'private';

    public static function fromQuery(?string $value): ?self
    {
        return ($value === null || $value === '') ? self::Feed : self::tryFrom($value);
    }

    public function requiresPasscode(): bool
    {
        return $this === self::Private;
    }
}
