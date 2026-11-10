<?php

declare(strict_types=1);

namespace App\Mailer\Handler;

use App\Dto\Mail\AccountDeletionCodeMailDto;
use App\Mailer\MailHandlerInterface;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<AccountDeletionCodeMailDto>
 */
final class AccountDeletionCodeMailHandler extends AbstractMailerHandler implements MailHandlerInterface
{
    public static function getDtoClass(): string
    {
        return AccountDeletionCodeMailDto::class;
    }

    protected function getTemplate(): string
    {
        return 'emails/auth/account_deletion_code.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return sprintf('Code de confirmation de suppression de compte : %s', $dto->code);
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->recipientEmail, $dto->recipientName)];
    }
}
