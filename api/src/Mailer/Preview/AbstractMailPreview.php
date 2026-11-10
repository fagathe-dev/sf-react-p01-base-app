<?php

declare(strict_types=1);

namespace App\Mailer\Preview;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Base des aperçus : construit les liens factices vers le front (FRONTEND_URL), comme les vrais e-mails.
 */
abstract class AbstractMailPreview implements MailPreviewInterface
{
    private const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

    public function __construct(
        #[Autowire('%env(default::FRONTEND_URL)%')]
        private readonly ?string $frontendUrl = null,
    ) {}

    /**
     * @param array<string, string> $query
     */
    protected function frontendUrl(string $path, array $query = []): string
    {
        $baseUrl = rtrim($this->frontendUrl ?: self::DEFAULT_FRONTEND_URL, '/');

        return $baseUrl . $path . ($query !== [] ? '?' . http_build_query($query) : '');
    }

    protected static function fakeToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    protected static function fakeCode(): string
    {
        return (string) random_int(100000, 999999);
    }
}
