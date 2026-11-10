<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\EmailPreviewService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/emails', name: 'api_admin_emails_')]
#[IsGranted('ROLE_ADMIN')]
final class EmailPreviewerController extends AbstractController
{
    public function __construct(private readonly EmailPreviewService $emailPreviewService) {}

    /**
     * Liste des e-mails prévisualisables (alimente le menu du front)
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return $this->json($this->emailPreviewService->getPreviews());
    }

    /**
     * Rendu HTML du template d'e-mail avec des données factices
     */
    #[Route('/{slug}', name: 'preview', requirements: ['slug' => '[a-z-]+'], methods: ['GET'])]
    public function preview(string $slug): Response
    {
        $html = $this->emailPreviewService->renderPreview($slug);

        if ($html === null) {
            throw $this->createNotFoundException(sprintf('Aucun e-mail "%s" à prévisualiser.', $slug));
        }

        return new Response($html);
    }
}
