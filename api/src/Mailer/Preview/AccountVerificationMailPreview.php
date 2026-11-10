<?php

declare(strict_types=1);

namespace App\Mailer\Preview;

use App\Dto\Mail\AccountVerificationMailDto;
use App\Service\AuthService;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 70)]
final class AccountVerificationMailPreview extends AbstractMailPreview
{
    public static function getSlug(): string
    {
        return 'account-verification';
    }

    public function getLabel(): string
    {
        return 'Vérification du compte';
    }

    public function getDescription(): string
    {
        return 'Lien d\'activation envoyé à l\'inscription.';
    }

    public function createDto(): object
    {
        return new AccountVerificationMailDto(
            recipientEmail: self::RECIPIENT_EMAIL,
            recipientName: self::RECIPIENT_NAME,
            verificationUrl: $this->frontendUrl('/verify-email', ['token' => self::fakeToken()]),
            ttlHours: AuthService::VERIFICATION_TTL_HOURS,
        );
    }
}
