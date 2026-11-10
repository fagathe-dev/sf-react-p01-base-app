<?php

declare(strict_types=1);

namespace App\Mailer\Preview;

use App\Dto\Mail\ForgotPasswordMailDto;
use App\Service\AuthService;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 40)]
final class ForgotPasswordMailPreview extends AbstractMailPreview
{
    public static function getSlug(): string
    {
        return 'forgot-password';
    }

    public function getLabel(): string
    {
        return 'Mot de passe oublié';
    }

    public function getDescription(): string
    {
        return 'Lien de réinitialisation du mot de passe.';
    }

    public function createDto(): object
    {
        return new ForgotPasswordMailDto(
            recipientEmail: self::RECIPIENT_EMAIL,
            recipientName: self::RECIPIENT_NAME,
            resetUrl: $this->frontendUrl('/reset-password', ['token' => self::fakeToken()]),
            ttlHours: AuthService::PASSWORD_RESET_TTL_HOURS,
        );
    }
}
