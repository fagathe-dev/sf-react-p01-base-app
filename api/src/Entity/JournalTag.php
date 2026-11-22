<?php

namespace App\Entity;

use App\Enum\ColorEnum;
use App\Repository\JournalTagRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Tag propre au journal (pastille Finder) : plusieurs tags par post, plusieurs tags peuvent partager une couleur.
 */
#[ORM\Entity(repositoryClass: JournalTagRepository::class)]
#[ORM\Table(name: 'journal_tag')]
#[ORM\Index(name: 'idx_journal_tag_owner', columns: ['owner_id'])]
#[ORM\UniqueConstraint(name: 'uniq_journal_tag_owner_slug', columns: ['owner_id', 'slug'])]
#[UniqueEntity(fields: ['owner', 'slug'], message: 'Vous avez déjà un tag portant ce nom.', errorPath: 'name')]
class JournalTag
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['journal_tag.list', 'journal_tag.read', 'journal_post.list', 'journal_post.read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(inversedBy: 'journalTags')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank(message: 'Le nom du tag est obligatoire.')]
    #[Assert\Length(max: 50, maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.')]
    #[Groups(['journal_tag.list', 'journal_tag.read', 'journal_post.list', 'journal_post.read'])]
    private ?string $name = null;

    #[ORM\Column(length: 60)]
    #[Groups(['journal_tag.list', 'journal_tag.read', 'journal_post.list', 'journal_post.read'])]
    private ?string $slug = null;

    #[ORM\Column(length: 20, enumType: ColorEnum::class)]
    #[Assert\NotNull(message: 'La couleur est obligatoire.')]
    #[Groups(['journal_tag.list', 'journal_tag.read', 'journal_post.list', 'journal_post.read'])]
    private ?ColorEnum $color = null;

    #[ORM\Column]
    #[Groups(['journal_tag.read'])]
    #[SerializedName('createdAt')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['journal_tag.read'])]
    #[SerializedName('updatedAt')]
    private ?\DateTimeImmutable $updatedAt = null;

    /**
     * @var Collection<int, JournalPost>
     */
    #[ORM\ManyToMany(targetEntity: JournalPost::class, mappedBy: 'tags')]
    private Collection $posts;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->posts = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getSlug(): ?string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): static
    {
        $this->slug = $slug;

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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    /**
     * @return Collection<int, JournalPost>
     */
    public function getPosts(): Collection
    {
        return $this->posts;
    }
}
