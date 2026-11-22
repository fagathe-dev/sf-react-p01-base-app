<?php

namespace App\Controller;

use App\Entity\JournalPost;
use App\Entity\User;
use App\Security\Voter\OwnerVoter;
use App\Service\JournalPostService;
use App\Service\JournalSecurityService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Posts du journal. Le Feed, les Souvenirs et les Enregistrés sont accessibles sans code ;
 * tout ce qui concerne un post privé exige l'en-tête X-JOURNAL-AUTH (sinon 403).
 */
#[Route('/journal/posts', name: 'api_journal_posts_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class JournalPostController extends AbstractController
{
    public function __construct(
        private readonly JournalPostService $service,
        private readonly JournalSecurityService $security,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        return $this->respond($this->service->list($user, $request, $this->hasPasscode($user, $request)));
    }

    #[Route('/counts', name: 'counts', methods: ['GET'])]
    public function counts(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        return $this->respond($this->service->counts($user, $this->hasPasscode($user, $request)));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        return $this->respond($this->service->create($user, $request, $this->hasPasscode($user, $request)));
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => Requirement::UUID], methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, JournalPost $post, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(OwnerVoter::EDIT, $post);

        return $this->respond($this->service->update($user, $post, $request, $this->hasPasscode($user, $request)));
    }

    #[Route('/{id}/bookmark', name: 'bookmark', requirements: ['id' => Requirement::UUID], methods: ['POST'])]
    public function bookmark(#[CurrentUser] User $user, JournalPost $post, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(OwnerVoter::EDIT, $post);

        return $this->respond($this->service->toggle($user, $post, 'bookmark', $this->hasPasscode($user, $request)));
    }

    #[Route('/{id}/pin', name: 'pin', requirements: ['id' => Requirement::UUID], methods: ['POST'])]
    public function pin(#[CurrentUser] User $user, JournalPost $post, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(OwnerVoter::EDIT, $post);

        return $this->respond($this->service->toggle($user, $post, 'pin', $this->hasPasscode($user, $request)));
    }

    #[Route('/{id}/toggle-private', name: 'toggle_private', requirements: ['id' => Requirement::UUID], methods: ['POST'])]
    public function togglePrivate(#[CurrentUser] User $user, JournalPost $post, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(OwnerVoter::EDIT, $post);

        return $this->respond($this->service->togglePrivate($user, $post, $this->hasPasscode($user, $request)));
    }

    #[Route('/{id}/medias', name: 'add_medias', requirements: ['id' => Requirement::UUID], methods: ['POST'])]
    public function addMedias(#[CurrentUser] User $user, JournalPost $post, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(OwnerVoter::EDIT, $post);

        return $this->respond($this->service->addMedias($user, $post, $request, $this->hasPasscode($user, $request)));
    }

    #[Route('/{id}/medias/{mediaId}', name: 'delete_media', requirements: ['id' => Requirement::UUID, 'mediaId' => Requirement::UUID], methods: ['DELETE'])]
    public function deleteMedia(#[CurrentUser] User $user, JournalPost $post, string $mediaId, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(OwnerVoter::EDIT, $post);

        return $this->respond($this->service->deleteMedia($post, $mediaId, $this->hasPasscode($user, $request)));
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => Requirement::UUID], methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, JournalPost $post, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(OwnerVoter::DELETE, $post);

        return $this->respond($this->service->delete($user, $post, $this->hasPasscode($user, $request)));
    }

    private function hasPasscode(User $user, Request $request): bool
    {
        return $this->security->hasValidToken($user, $request);
    }

    private function respond(object $res): JsonResponse
    {
        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
