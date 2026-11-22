<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CorePhp\Http\ResponseTrait;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Code secret du journal : délivre le jCodeToken et contrôle l'en-tête X-JOURNAL-AUTH.
 *
 * Seul le contenu privé (onglet « Privé », posts is_private) exige cet en-tête, et seulement si la protection
 * est active (code défini + protection activée dans le profil) ; le Feed, les Souvenirs, les Enregistrés et les
 * Tags restent toujours accessibles sans code.
 */
final class JournalSecurityService
{
    use ResponseTrait;

    public const HEADER = 'X-JOURNAL-AUTH';

    public function __construct(private readonly EntityManagerInterface $em) {}

    /**
     * POST /api/journal/unlock : vérifie le code secret et renvoie le jCodeToken (créé au premier déverrouillage).
     */
    public function unlock(User $user, Request $request): object
    {
        if (!$user->hasJournalPasscode()) {
            return $this->sendJson(['message' => 'Aucun code secret configuré pour ce compte.'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);
        $passcode = trim((string) (is_array($data) ? ($data['passcode'] ?? '') : ''));

        if ($passcode === '') {
            return $this->sendJson(['message' => 'Le code secret est obligatoire.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!password_verify($passcode, (string) $user->getJournalPasscode())) {
            return $this->sendJson(['message' => 'Code secret incorrect.'], Response::HTTP_FORBIDDEN);
        }

        if (!$user->getJCodeToken()) {
            $user->setJCodeToken(bin2hex(random_bytes(40)));
            $this->em->flush();
        }

        return $this->sendJson([
            'jCodeToken' => $user->getJCodeToken(),
            'message'    => 'Journal déverrouillé avec succès.',
        ]);
    }

    /**
     * Accès au contenu privé : libre si la protection n'est pas active, sinon jeton X-JOURNAL-AUTH valide exigé.
     */
    public function hasValidToken(User $user, Request $request): bool
    {
        if (!$user->isJournalLockActive()) {
            return true;
        }

        $headerToken = (string) $request->headers->get(self::HEADER, '');
        $expectedToken = (string) $user->getJCodeToken();

        return $headerToken !== '' && $expectedToken !== '' && hash_equals($expectedToken, $headerToken);
    }

    public function forbidden(): object
    {
        return $this->sendJson(
            ['message' => 'Accès refusé : contenu privé, journal verrouillé ou jeton invalide.'],
            Response::HTTP_FORBIDDEN,
        );
    }
}
