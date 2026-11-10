<?php

declare(strict_types=1);

namespace App\Mailer\Preview;

use App\Dto\Mail\RegistrationConfirmedMailDto;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 50)]
final class RegistrationConfirmedMailPreview extends AbstractMailPreview
{
    public static function getSlug(): string
    {
        return 'registration-confirmed';
    }

    public function getLabel(): string
    {
        return 'Bienvenue';
    }

    public function getDescription(): string
    {
        return 'Confirmation envoyée une fois l\'adresse e-mail vérifiée.';
    }

    public function createDto(): object
    {
        return new RegistrationConfirmedMailDto(
            recipientEmail: self::RECIPIENT_EMAIL,
            recipientName: self::RECIPIENT_NAME,
            loginUrl: $this->frontendUrl('/login'),
        );
    }
}
