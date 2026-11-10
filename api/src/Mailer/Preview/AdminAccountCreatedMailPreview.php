<?php

declare(strict_types=1);

namespace App\Mailer\Preview;

use App\Dto\Mail\AdminAccountCreatedMailDto;
use App\Enum\Auth\RoleEnum;
use App\Service\AdminUserManager;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 10)]
final class AdminAccountCreatedMailPreview extends AbstractMailPreview
{
    public static function getSlug(): string
    {
        return 'admin-account-created';
    }

    public function getLabel(): string
    {
        return 'Compte administrateur créé';
    }

    public function getDescription(): string
    {
        return 'Récapitulatif et lien de changement de mot de passe (core-php:create-admin-user).';
    }

    public function createDto(): object
    {
        return new AdminAccountCreatedMailDto(
            recipientEmail: self::RECIPIENT_EMAIL,
            recipientName: self::RECIPIENT_NAME,
            username: 'jane.admin',
            plainPassword: 'MotDePasse123',
            roleLabel: RoleEnum::mapRole(RoleEnum::RoleAdmin),
            loginUrl: $this->frontendUrl('/login'),
            changePasswordUrl: $this->frontendUrl('/reset-password', ['token' => self::fakeToken()]),
            createdAt: new \DateTimeImmutable(),
            ttlHours: AdminUserManager::PASSWORD_LINK_TTL_HOURS,
        );
    }
}
