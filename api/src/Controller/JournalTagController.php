<?php

namespace App\Controller;

use App\Entity\JournalTag;
use App\Entity\User;
use App\Security\Voter\OwnerVoter;
use App\Service\JournalSecurityService;
use App\Service\JournalTagService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/journal/tags', name: 'api_journal_tags_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class JournalTagController extends AbstractController
{
    public function __construct(
        private readonly JournalTagService $service,
        private readonly JournalSecurityService $security,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        return $this->respond($this->service->list($user, $this->security->hasValidToken($user, $request)));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        return $this->respond($this->service->create($user, $request));
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => Requirement::UUID], methods: ['PUT'])]
    public function update(#[CurrentUser] User $user, JournalTag $tag, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(OwnerVoter::EDIT, $tag);

        return $this->respond($this->service->update($user, $tag, $request));
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => Requirement::UUID], methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, JournalTag $tag): JsonResponse
    {
        $this->denyAccessUnlessGranted(OwnerVoter::DELETE, $tag);

        return $this->respond($this->service->delete($user, $tag));
    }

    private function respond(object $res): JsonResponse
    {
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
