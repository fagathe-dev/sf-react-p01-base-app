<?php

namespace App\Service;

use App\Dto\Journal\JournalTagDto;
use App\Entity\JournalTag;
use App\Entity\User;
use App\Repository\JournalTagRepository;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\String\Slugger\AsciiSlugger;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

/**
 * Tags dédiés au journal. Accessibles sans code PIN : seuls les posts publics sont comptés,
 * sauf si l'en-tête X-JOURNAL-AUTH est valide.
 */
final class JournalTagService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait;

    private const CONTEXT = ['groups' => ['journal_tag.read']];

    public function __construct(
        private readonly JournalTagRepository $repository,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {}

    /**
     * GET /api/journal/tags : tags triés par nom, avec `postCount`.
     */
    public function list(User $user, bool $hasPasscode): object
    {
        $rows = $this->repository->findWithPostCounts($user, $hasPasscode);

        $data = array_map(
            fn(array $row): array => [
                ...$this->serializer->normalize($row['tag'], null, self::CONTEXT),
                'postCount' => $row['postCount'],
            ],
            $rows,
        );

        return $this->sendJson($data);
    }

    public function create(User $user, Request $request): object
    {
        $dto = $this->readDto($request);
        if ($dto === null) {
            return $this->sendJson(['message' => 'Format JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto, groups: ['create']);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $tag = (new JournalTag())
            ->setOwner($user)
            ->setName(trim((string) $dto->name))
            ->setColor($dto->color)
            ->setCreatedAt($this->now());

        if ($error = $this->applySlug($user, $tag)) {
            return $error;
        }

        return $this->persist($user, $tag, Response::HTTP_CREATED, 'journal.tag.create.critical_error');
    }

    public function update(User $user, JournalTag $tag, Request $request): object
    {
        $dto = $this->readDto($request);
        if ($dto === null) {
            return $this->sendJson(['message' => 'Format JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto, groups: ['update']);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        if ($dto->name !== null) {
            if (trim($dto->name) === '') {
                return $this->sendViolations(['name' => 'Le nom du tag est obligatoire.']);
            }
            $tag->setName(trim($dto->name));
            if ($error = $this->applySlug($user, $tag)) {
                return $error;
            }
        }

        if ($dto->color !== null) {
            $tag->setColor($dto->color);
        }

        $tag->setUpdatedAt($this->now());

        return $this->persist($user, $tag, Response::HTTP_OK, 'journal.tag.update.critical_error');
    }

    public function delete(User $user, JournalTag $tag): object
    {
        try {
            $this->repository->remove($tag);

            return $this->sendNoContent();
        } catch (Throwable $e) {
            return $this->serverError('journal.tag.delete.critical_error', $user, $e);
        }
    }

    private function readDto(Request $request): ?JournalTagDto
    {
        try {
            return $this->serializer->deserialize($request->getContent(), JournalTagDto::class, 'json');
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Le slug sert au filtre ?tag=<slug> : unique par utilisateur, donc deux tags ne peuvent pas porter le même nom.
     */
    private function applySlug(User $user, JournalTag $tag): ?object
    {
        $slug = (new AsciiSlugger())->slug((string) $tag->getName())->lower()->truncate(60)->toString();
        if ($slug === '') {
            return $this->sendViolations(['name' => 'Le nom doit contenir au moins une lettre ou un chiffre.']);
        }

        if ($this->repository->slugExistsForOwner($user, $slug, $tag->getId())) {
            return $this->sendViolations(['name' => 'Vous avez déjà un tag portant ce nom.']);
        }

        $tag->setSlug($slug);

        return null;
    }

    private function persist(User $user, JournalTag $tag, int $status, string $action): object
    {
        $violations = $this->validator->validate($tag);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        try {
            $this->repository->save($tag);
        } catch (Throwable $e) {
            return $this->serverError($action, $user, $e);
        }

        return $this->sendJson($tag, $status, context: self::CONTEXT);
    }

    private function serverError(string $action, User $user, Throwable $e): object
    {
        $this->generateLog(
            LoggerLevelEnum::Critical,
            ['message' => 'Erreur interne des tags du journal', 'user' => $user->getUserIdentifier(), 'exception' => $e],
            ['action' => $action]
        );

        return $this->sendJson(['message' => 'Erreur interne des tags du journal.'], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}
