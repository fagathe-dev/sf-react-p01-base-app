<?php

namespace App\Dto\Journal;

use App\Enum\ColorEnum;
use Symfony\Component\Validator\Constraints as Assert;

final class JournalTagDto
{
    #[Assert\NotBlank(message: 'Le nom du tag est obligatoire.', groups: ['create'])]
    #[Assert\Length(max: 50, maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.', groups: ['create', 'update'])]
    public ?string $name = null;

    #[Assert\NotBlank(message: 'La couleur est obligatoire.', groups: ['create'])]
    #[Assert\Choice(callback: [ColorEnum::class, 'values'], message: 'Couleur invalide.', groups: ['create', 'update'])]
    public ?string $color = null;
}
