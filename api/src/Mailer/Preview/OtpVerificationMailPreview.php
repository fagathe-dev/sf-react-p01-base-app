<?php

declare(strict_types=1);

namespace App\Mailer\Preview;

use App\Dto\Mail\OtpVerificationMailDto;
use App\Service\AuthService;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 60)]
final class OtpVerificationMailPreview extends AbstractMailPreview
{
    public static function getSlug(): string
    {
        return 'otp-verification';
    }

    public function getLabel(): string
    {
        return 'Code de connexion';
    }

    public function getDescription(): string
    {
        return 'Code à 6 chiffres (1 min 30) pour la connexion sans mot de passe.';
    }

    public function createDto(): object
    {
        return new OtpVerificationMailDto(
            recipientEmail: self::RECIPIENT_EMAIL,
            recipientName: self::RECIPIENT_NAME,
            otpCode: self::fakeCode(),
            purposeLabel: AuthService::LOGIN_CODE_PURPOSE_LABEL,
            validityLabel: AuthService::LOGIN_CODE_VALIDITY_LABEL,
        );
    }
}
