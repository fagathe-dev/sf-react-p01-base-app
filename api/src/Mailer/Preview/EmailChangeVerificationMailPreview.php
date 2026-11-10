<?php

declare(strict_types=1);

namespace App\Mailer\Preview;

use App\Dto\Mail\EmailChangeVerificationMailDto;
use App\Service\AccountService;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 30)]
final class EmailChangeVerificationMailPreview extends AbstractMailPreview
{
    public static function getSlug(): string
    {
        return 'email-change-verification';
    }

    public function getLabel(): string
    {
        return 'Changement d\'e-mail';
    }

    public function getDescription(): string
    {
        return 'Lien de confirmation envoyé sur la nouvelle adresse.';
    }

    public function createDto(): object
    {
        return new EmailChangeVerificationMailDto(
            newEmail: 'jane.new@example.com',
            recipientName: self::RECIPIENT_NAME,
            confirmationUrl: $this->frontendUrl('/confirm-email-change', ['token' => self::fakeToken()]),
            ttlHours: AccountService::EMAIL_CHANGE_TTL_HOURS,
        );
    }
}
