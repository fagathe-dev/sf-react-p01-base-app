<?php

declare(strict_types=1);

namespace App\Mailer\Handler;

use App\Dto\Mail\AccountVerificationMailDto;
use App\Mailer\MailHandlerInterface;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<AccountVerificationMailDto>
 */
final class AccountVerificationMailHandler extends AbstractMailerHandler implements MailHandlerInterface
{
    public static function getDtoClass(): string
    {
        return AccountVerificationMailDto::class;
    }

    protected function getTemplate(): string
    {
        return 'emails/auth/account_verification.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return 'Activez votre compte et vérifiez votre adresse e-mail';
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->recipientEmail, $dto->recipientName)];
    }
}