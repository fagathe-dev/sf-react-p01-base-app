<?php

namespace App\Dto\Journal;

use App\Enum\ColorEnum;
use App\Enum\MoodEnum;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Charge utile d'un post (création ou mise à jour), lue en JSON ou en multipart/form-data.
 *
 * `provided` liste les champs réellement envoyés : en PATCH, un champ absent n'est pas modifié,
 * alors qu'un champ envoyé vide (ex. mood: null) est effacé.
 */
final class JournalPostDto
{
    #[Assert\Length(max: 20000, maxMessage: 'Le contenu ne peut pas dépasser {{ limit }} caractères.')]
    public ?string $content = null;

    #[Assert\Choice(callback: [MoodEnum::class, 'values'], message: 'Humeur invalide.')]
    public ?string $mood = null;

    #[Assert\Choice(callback: [ColorEnum::class, 'values'], message: 'Couleur invalide.')]
    public ?string $color = null;

    /** @var string[] */
    #[Assert\All([new Assert\Uuid(message: 'Identifiant de tag invalide.')])]
    public array $tagIds = [];

    /** @var array{name?: mixed, latitude?: mixed, longitude?: mixed, street?: mixed, city?: mixed, country?: mixed}|null */
    public ?array $location = null;

    #[Assert\Uuid(message: 'Identifiant du post parent invalide.')]
    public ?string $parentId = null;

    public ?bool $isPinned = null;

    public ?bool $isBookmarked = null;

    public ?bool $isPrivate = null;

    /** @var UploadedFile[] */
    public array $medias = [];

    /** @var array<string, true> */
    private array $provided = [];

    public static function fromRequest(Request $request): self
    {
        $isMultipart = str_starts_with((string) $request->headers->get('Content-Type'), 'multipart/form-data');
        $data = $isMultipart ? $request->request->all() : (json_decode($request->getContent(), true) ?: []);

        $dto = new self();
        if (!is_array($data)) {
            return $dto;
        }

        foreach (array_keys($data) as $key) {
            $dto->provided[(string) $key] = true;
        }

        $dto->content = array_key_exists('content', $data) ? (string) $data['content'] : null;
        // En multipart, une valeur effacée arrive sous forme de chaîne vide
        $dto->mood = self::nullableString($data['mood'] ?? null);
        $dto->color = self::nullableString($data['color'] ?? null);
        $dto->parentId = self::nullableString($data['parentId'] ?? null);
        $dto->tagIds = self::stringList($data['tagIds'] ?? []);
        $dto->location = self::location($data['location'] ?? null);
        $dto->isPinned = self::nullableBool($data, 'isPinned');
        $dto->isBookmarked = self::nullableBool($data, 'isBookmarked');
        $dto->isPrivate = self::nullableBool($data, 'isPrivate');

        foreach ($request->files->all() as $item) {
            foreach (is_array($item) ? $item : [$item] as $file) {
                if ($file instanceof UploadedFile) {
                    $dto->medias[] = $file;
                }
            }
        }

        return $dto;
    }

    public function has(string $field): bool
    {
        return isset($this->provided[$field]);
    }

    private static function nullableString(mixed $value): ?string
    {
        return is_scalar($value) && trim((string) $value) !== '' ? trim((string) $value) : null;
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function nullableBool(array $data, string $key): ?bool
    {
        if (!array_key_exists($key, $data) || $data[$key] === null || $data[$key] === '') {
            return null;
        }

        return filter_var($data[$key], FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * @return string[]
     */
    private static function stringList(mixed $value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $value = is_array($decoded) ? $decoded : ($value === '' ? [] : [$value]);
        }

        return is_array($value) ? array_values(array_unique(array_map('strval', array_filter($value, 'is_scalar')))) : [];
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function location(mixed $value): ?array
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }

        return is_array($value) && isset($value['latitude'], $value['longitude']) ? $value : null;
    }
}
