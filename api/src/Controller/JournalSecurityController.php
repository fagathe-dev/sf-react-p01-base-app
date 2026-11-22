<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\JournalSecurityService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/journal', name: 'api_journal_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class JournalSecurityController extends AbstractController
{
    public function __construct(private readonly JournalSecurityService $security) {}

    /**
     * POST /api/journal/unlock : vérifie le code secret et délivre le jCodeToken (en-tête X-JOURNAL-AUTH).
     */
    #[Route('/unlock', name: 'unlock', methods: ['POST'])]
    public function unlock(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $res = $this->security->unlock($user, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
