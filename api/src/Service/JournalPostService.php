<?php

namespace App\Service;

use App\Dto\Journal\JournalPostDto;
use App\Entity\JournalLocation;
use App\Entity\JournalMedia;
use App\Entity\JournalPost;
use App\Entity\User;
use App\Enum\JournalTabEnum;
use App\Repository\JournalPostRepository;
use App\Repository\JournalTagRepository;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Fagathe\CorePhp\Uploader\FileUploadException;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\Normalizer\AbstractObjectNormalizer;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

/**
 * Posts du journal : fil, souvenirs, enregistrés, privés, suites (threads) et médias.
 *
 * Chaque méthode reçoit `$hasPasscode` (en-tête X-JOURNAL-AUTH valide) : tout ce qui touche un post privé l'exige.
 */
final class JournalPostService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait;

    public const SERIALIZATION_CONTEXT = [
        'groups' => ['journal_post.read', 'file.read'],
        AbstractObjectNormalizer::ENABLE_MAX_DEPTH => true,
    ];

    public function __construct(
        private readonly JournalPostRepository $repository,
        private readonly JournalTagRepository $tagRepository,
        private readonly AttachmentFileService $fileService,
        private readonly JournalSecurityService $security,
        private readonly ValidatorInterface $validator,
    ) {}

    /**
     * GET /api/journal/posts?tab=feed|memories|bookmarks|private&tag=<slug>&q=<recherche>
     */
    public function list(User $user, Request $request, bool $hasPasscode): object
    {
        $tab = JournalTabEnum::fromQuery($request->query->getString('tab'));
        if ($tab === null) {
            return $this->sendJson(['message' => 'Onglet inconnu (feed, memories, bookmarks ou private).'], Response::HTTP_BAD_REQUEST);
        }

        if ($tab->requiresPasscode() && !$hasPasscode) {
            return $this->security->forbidden();
        }

        $posts = $this->repository->findRootPostsForTab(
            $user,
            $tab,
            $this->now(),
            $request->query->getString('tag') ?: null,
            $request->query->getString('q') ?: null,
        );

        return $this->sendJson($posts, Response::HTTP_OK, context: self::SERIALIZATION_CONTEXT);
    }

    /**
     * GET /api/journal/posts/counts : compteurs des onglets (badges). `private` n'est renvoyé qu'avec le code.
     */
    public function counts(User $user, bool $hasPasscode): object
    {
        $now = $this->now();
        $counts = [];

        foreach (JournalTabEnum::cases() as $tab) {
            if ($tab->requiresPasscode() && !$hasPasscode) {
                continue;
            }
            $counts[$tab->value] = $this->repository->countRootPostsForTab($user, $tab, $now);
        }

        return $this->sendJson($counts);
    }

    /**
     * POST /api/journal/posts : post racine, ou suite si `parentId` est fourni.
     */
    public function create(User $user, Request $request, bool $hasPasscode): object
    {
        $dto = JournalPostDto::fromRequest($request);
        if ($error = $this->validate($dto)) {
            return $error;
        }

        $parent = null;
        if ($dto->parentId !== null) {
            $parent = $this->repository->find(Uuid::fromString($dto->parentId));
            if (!$parent instanceof JournalPost || $parent->getOwner() !== $user) {
                return $this->sendJson(['message' => 'Post parent introuvable.'], Response::HTTP_NOT_FOUND);
            }
            if ($parent->isReply()) {
                return $this->sendViolations(['parentId' => 'Une suite ne peut pas recevoir de suite : répondez au post initial.']);
            }
        }

        // Une suite hérite toujours de la confidentialité de son post initial
        $isPrivate = $parent?->isPrivate() ?? (bool) $dto->isPrivate;
        if ($isPrivate && !$hasPasscode) {
            return $this->security->forbidden();
        }

        if (trim((string) $dto->content) === '' && $dto->medias === []) {
            return $this->sendViolations(['content' => 'Le contenu est obligatoire si aucun média n\'est joint.']);
        }

        $post = (new JournalPost())
            ->setOwner($user)
            ->setContent($dto->content)
            ->setMood($dto->mood)
            ->setColor($dto->color)
            ->setIsPinned($parent === null && (bool) $dto->isPinned)
            ->setIsBookmarked((bool) $dto->isBookmarked)
            ->setIsPrivate($isPrivate)
            ->setCreatedAt($this->now());

        $parent?->addReply($post);
        $this->applyTags($post, $user, $dto->tagIds);
        $this->applyLocation($post, $user, $dto->location);

        try {
            $this->repository->save($post);
            $this->attachMedias($post, $user, $dto);
        } catch (FileUploadException $e) {
            // Le post est créé : on le retire pour ne pas laisser un post sans le média attendu
            $this->deletePostAndFiles($post);

            return $this->sendViolations(['medias' => $e->getMessage()]);
        } catch (Throwable $e) {
            return $this->serverError('journal.post.create.critical_error', $user, $e);
        }

        return $this->sendJson($parent ?? $post, Response::HTTP_CREATED, context: self::SERIALIZATION_CONTEXT);
    }

    /**
     * PATCH /api/journal/posts/{id} : seuls les champs envoyés sont modifiés.
     */
    public function update(User $user, JournalPost $post, Request $request, bool $hasPasscode): object
    {
        $dto = JournalPostDto::fromRequest($request);
        if ($error = $this->validate($dto)) {
            return $error;
        }

        $becomesPrivate = $dto->has('isPrivate') && $dto->isPrivate === true;
        if (($post->isPrivate() || $becomesPrivate) && !$hasPasscode) {
            return $this->security->forbidden();
        }

        if ($dto->has('content')) {
            if (trim((string) $dto->content) === '' && $post->getMedias()->isEmpty()) {
                return $this->sendViolations(['content' => 'Le contenu est obligatoire si aucun média n\'est joint.']);
            }
            $post->setContent($dto->content);
        }

        if ($dto->has('mood')) {
            $post->setMood($dto->mood);
        }
        if ($dto->has('color')) {
            $post->setColor($dto->color);
        }
        if ($dto->has('tagIds')) {
            $this->applyTags($post, $user, $dto->tagIds);
        }
        if ($dto->has('location')) {
            $this->applyLocation($post, $user, $dto->location);
        }
        if ($dto->isPinned !== null) {
            $post->setIsPinned($dto->isPinned);
        }
        if ($dto->isBookmarked !== null) {
            $post->setIsBookmarked($dto->isBookmarked);
        }
        if ($dto->isPrivate !== null) {
            if ($post->isReply()) {
                return $this->sendViolations(['isPrivate' => 'La confidentialité se règle sur le post initial.']);
            }
            $post->setIsPrivate($dto->isPrivate);
        }

        return $this->saveAndRespond($user, $post, 'journal.post.update.critical_error');
    }

    /**
     * POST /api/journal/posts/{id}/bookmark | /pin : bascule le drapeau.
     */
    public function toggle(User $user, JournalPost $post, string $flag, bool $hasPasscode): object
    {
        if ($post->isPrivate() && !$hasPasscode) {
            return $this->security->forbidden();
        }

        match ($flag) {
            'bookmark' => $post->setIsBookmarked(!$post->isBookmarked()),
            'pin'      => $post->setIsPinned(!$post->isPinned()),
        };

        return $this->saveAndRespond($user, $post, 'journal.post.toggle.critical_error');
    }

    /**
     * POST /api/journal/posts/{id}/toggle-private : un post privé ou qui le devient exige toujours le code.
     */
    public function togglePrivate(User $user, JournalPost $post, bool $hasPasscode): object
    {
        if (!$hasPasscode) {
            return $this->security->forbidden();
        }

        if ($post->isReply()) {
            return $this->sendViolations(['isPrivate' => 'La confidentialité se règle sur le post initial.']);
        }

        $post->setIsPrivate(!$post->isPrivate());

        return $this->saveAndRespond($user, $post, 'journal.post.toggle_private.critical_error');
    }

    /**
     * POST /api/journal/posts/{id}/medias : ajoute des médias à un post existant (multipart, champ medias[]).
     */
    public function addMedias(User $user, JournalPost $post, Request $request, bool $hasPasscode): object
    {
        if ($post->isPrivate() && !$hasPasscode) {
            return $this->security->forbidden();
        }

        $dto = JournalPostDto::fromRequest($request);
        if ($dto->medias === []) {
            return $this->sendViolations(['medias' => 'Aucun média fourni.']);
        }

        try {
            $this->attachMedias($post, $user, $dto);
        } catch (FileUploadException $e) {
            return $this->sendViolations(['medias' => $e->getMessage()]);
        }

        return $this->saveAndRespond($user, $post, 'journal.post.media.critical_error');
    }

    /**
     * DELETE /api/journal/posts/{id}/medias/{mediaId}
     */
    public function deleteMedia(JournalPost $post, string $mediaId, bool $hasPasscode): object
    {
        if ($post->isPrivate() && !$hasPasscode) {
            return $this->security->forbidden();
        }

        $media = $post->getMedias()->findFirst(
            static fn(int $key, JournalMedia $m): bool => (string) $m->getId() === $mediaId
        );

        if (!$media instanceof JournalMedia) {
            return $this->sendJson(['message' => 'Média introuvable pour ce post.'], Response::HTTP_NOT_FOUND);
        }

        if (trim($post->getContent()) === '' && $post->getMedias()->count() === 1) {
            return $this->sendViolations(['medias' => 'Un post sans texte doit garder au moins un média.']);
        }

        $post->removeMedia($media);
        if (!$this->fileService->delete($media)) {
            return $this->sendJson(['message' => 'Erreur interne lors de la suppression du média.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->sendNoContent();
    }

    /**
     * DELETE /api/journal/posts/{id} : fichiers sur disque (post et suites) puis suppression en cascade.
     */
    public function delete(User $user, JournalPost $post, bool $hasPasscode): object
    {
        if ($post->isPrivate() && !$hasPasscode) {
            return $this->security->forbidden();
        }

        try {
            $this->deletePostAndFiles($post);

            return $this->sendNoContent();
        } catch (Throwable $e) {
            return $this->serverError('journal.post.delete.critical_error', $user, $e);
        }
    }

    private function deletePostAndFiles(JournalPost $post): void
    {
        foreach ([$post, ...$post->getReplies()->toArray()] as $item) {
            $this->fileService->deleteByTarget($item);
        }

        $post->getParent()?->removeReply($post);
        $this->repository->remove($post);
    }

    /**
     * @param string[] $tagIds
     */
    private function applyTags(JournalPost $post, User $user, array $tagIds): void
    {
        $post->clearTags();
        foreach ($this->tagRepository->findOwnedByIds($user, $tagIds) as $tag) {
            $post->addTag($tag);
        }
    }

    /**
     * @param array<string, mixed>|null $data
     */
    private function applyLocation(JournalPost $post, User $user, ?array $data): void
    {
        if ($data === null) {
            $post->setLocation(null);

            return;
        }

        $latitude = (float) $data['latitude'];
        $longitude = (float) $data['longitude'];
        $text = static fn(string $key): ?string => isset($data[$key]) && trim((string) $data[$key]) !== '' ? trim((string) $data[$key]) : null;

        $location = $post->getLocation();
        if ($location === null) {
            $location = (new JournalLocation())->setOwner($user)->setCreatedAt($this->now());
        } else {
            $location->setUpdatedAt($this->now());
        }

        $location
            ->setLatitude($latitude)
            ->setLongitude($longitude)
            ->setName($text('name') ?? sprintf('%s, %s', $latitude, $longitude))
            ->setStreet($text('street'))
            ->setCity($text('city'))
            ->setCountry($text('country'));

        $post->setLocation($location);
    }

    /**
     * @throws FileUploadException
     */
    private function attachMedias(JournalPost $post, User $user, JournalPostDto $dto): void
    {
        foreach ($dto->medias as $file) {
            /** @var JournalMedia $media */
            $media = $this->fileService->upload($file, $post, $user);
            $post->addMedia($media);
        }
    }

    private function validate(JournalPostDto $dto): ?object
    {
        $violations = $this->validator->validate($dto);

        return count($violations) > 0 ? $this->sendViolations($violations) : null;
    }

    /**
     * Enregistre et renvoie le post racine complet (le front remplace la carte entière, suites comprises).
     */
    private function saveAndRespond(User $user, JournalPost $post, string $action): object
    {
        try {
            $post->setUpdatedAt($this->now());
            $this->repository->save($post);
        } catch (Throwable $e) {
            return $this->serverError($action, $user, $e);
        }

        return $this->sendJson($post->getParent() ?? $post, Response::HTTP_OK, context: self::SERIALIZATION_CONTEXT);
    }

    private function serverError(string $action, User $user, Throwable $e): object
    {
        $this->generateLog(
            LoggerLevelEnum::Critical,
            ['message' => 'Erreur interne du journal', 'user' => $user->getUserIdentifier(), 'exception' => $e],
            ['action' => $action]
        );

        return $this->sendJson(['message' => 'Erreur interne du journal.'], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}
