<?php

namespace App\Entity;

use App\Enum\ColorEnum;
use App\Enum\MoodEnum;
use App\Repository\JournalPostRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\MaxDepth;
use Symfony\Component\Serializer\Attribute\SerializedName;

/**
 * Post du journal (micro-blogging privé). Un post racine (parent nul) peut recevoir des « suites » (replies),
 * sur un seul niveau : une suite ne peut pas elle-même avoir de suite.
 *
 * Confidentialité : un post `is_private` n'est lisible ou modifiable qu'avec l'en-tête X-JOURNAL-AUTH.
 * Les suites héritent toujours de la confidentialité de leur post racine.
 */
#[ORM\Entity(repositoryClass: JournalPostRepository::class)]
#[ORM\Table(name: 'journal_post')]
#[ORM\Index(name: 'idx_journal_post_owner', columns: ['owner_id'])]
#[ORM\Index(name: 'idx_journal_post_parent', columns: ['parent_id'])]
#[ORM\Index(name: 'idx_journal_post_location', columns: ['location_id'])]
#[ORM\Index(name: 'idx_journal_post_private', columns: ['owner_id', 'is_private'])]
#[ORM\Index(name: 'idx_journal_post_created_at', columns: ['created_at'])]
#[ORM\Index(name: 'idx_ft_journal_post_content', columns: ['content'], flags: ['fulltext'])]
class JournalPost extends AbstractTextEntry
{
    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    private string $content = '';

    #[ORM\Column(length: 50, nullable: true, enumType: MoodEnum::class)]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    private ?MoodEnum $mood = null;

    #[ORM\Column(length: 30, nullable: true, enumType: ColorEnum::class)]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    private ?ColorEnum $color = null;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    private bool $is_bookmarked = false;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    private bool $is_private = false;

    #[ORM\ManyToOne(inversedBy: 'journalPosts')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'replies')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    private ?self $parent = null;

    /**
     * Suites du post, sérialisées sur un seul niveau (MaxDepth).
     *
     * @var Collection<int, self>
     */
    #[ORM\OneToMany(targetEntity: self::class, mappedBy: 'parent', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['created_at' => 'ASC'])]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    #[MaxDepth(1)]
    private Collection $replies;

    #[ORM\ManyToOne(targetEntity: JournalLocation::class, cascade: ['persist'])]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    private ?JournalLocation $location = null;

    /**
     * @var Collection<int, JournalTag>
     */
    #[ORM\ManyToMany(targetEntity: JournalTag::class, inversedBy: 'posts')]
    #[ORM\JoinTable(name: 'journal_post_tag')]
    #[ORM\JoinColumn(name: 'journal_post_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'journal_tag_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    private Collection $tags;

    /**
     * @var Collection<int, JournalMedia>
     */
    #[ORM\OneToMany(targetEntity: JournalMedia::class, mappedBy: 'post', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    private Collection $medias;

    public function __construct()
    {
        parent::__construct();
        $this->replies = new ArrayCollection();
        $this->tags = new ArrayCollection();
        $this->medias = new ArrayCollection();
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(?string $content): static
    {
        $this->content = trim((string) $content);

        return $this;
    }

    public function getMood(): ?MoodEnum
    {
        return $this->mood;
    }

    public function setMood(MoodEnum|string|null $mood): static
    {
        $this->mood = is_string($mood) ? MoodEnum::tryFrom($mood) : $mood;

        return $this;
    }

    public function getColor(): ?ColorEnum
    {
        return $this->color;
    }

    public function setColor(ColorEnum|string|null $color): static
    {
        $this->color = is_string($color) ? ColorEnum::tryFrom($color) : $color;

        return $this;
    }

    public function isBookmarked(): bool
    {
        return $this->is_bookmarked;
    }

    public function setIsBookmarked(bool $isBookmarked): static
    {
        $this->is_bookmarked = $isBookmarked;

        return $this;
    }

    public function isPrivate(): bool
    {
        return $this->is_private;
    }

    /**
     * Applique la confidentialité au post et à toutes ses suites (elles suivent toujours leur racine).
     */
    public function setIsPrivate(bool $isPrivate): static
    {
        $this->is_private = $isPrivate;

        foreach ($this->replies as $reply) {
            $reply->setIsPrivate($isPrivate);
        }

        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): static
    {
        $this->parent = $parent;

        return $this;
    }

    public function isReply(): bool
    {
        return $this->parent !== null;
    }

    #[Groups(['journal_post.list', 'journal_post.read'])]
    #[SerializedName('parent_id')]
    public function getParentId(): ?string
    {
        return $this->parent?->getId()?->toRfc4122();
    }

    /**
     * @return Collection<int, self>
     */
    public function getReplies(): Collection
    {
        return $this->replies;
    }

    public function addReply(self $reply): static
    {
        if (!$this->replies->contains($reply)) {
            $this->replies->add($reply);
            $reply->setParent($this);
        }

        return $this;
    }

    public function removeReply(self $reply): static
    {
        if ($this->replies->removeElement($reply) && $reply->getParent() === $this) {
            $reply->setParent(null);
        }

        return $this;
    }

    public function getLocation(): ?JournalLocation
    {
        return $this->location;
    }

    public function setLocation(?JournalLocation $location): static
    {
        $this->location = $location;

        return $this;
    }

    /**
     * @return Collection<int, JournalTag>
     */
    public function getTags(): Collection
    {
        return $this->tags;
    }

    public function addTag(JournalTag $tag): static
    {
        if (!$this->tags->contains($tag)) {
            $this->tags->add($tag);
        }

        return $this;
    }

    public function removeTag(JournalTag $tag): static
    {
        $this->tags->removeElement($tag);

        return $this;
    }

    public function clearTags(): static
    {
        $this->tags->clear();

        return $this;
    }

    /**
     * @return Collection<int, JournalMedia>
     */
    public function getMedias(): Collection
    {
        return $this->medias;
    }

    public function addMedia(JournalMedia $media): static
    {
        if (!$this->medias->contains($media)) {
            $this->medias->add($media);
            $media->setPost($this);
        }

        return $this;
    }

    public function removeMedia(JournalMedia $media): static
    {
        if ($this->medias->removeElement($media) && $media->getPost() === $this) {
            $media->setPost(null);
        }

        return $this;
    }
}
