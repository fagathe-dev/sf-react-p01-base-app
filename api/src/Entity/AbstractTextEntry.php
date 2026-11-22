<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

/**
 * Socle commun des contenus textuels datés et épinglables (aujourd'hui : JournalPost).
 */
#[ORM\MappedSuperclass]
abstract class AbstractTextEntry
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    private ?Uuid $id = null;

    #[ORM\Column]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    protected ?\DateTimeImmutable $created_at = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    protected ?\DateTimeImmutable $updated_at = null;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['journal_post.list', 'journal_post.read'])]
    protected bool $is_pinned = false;

    public function __construct()
    {
        $this->id = Uuid::v7();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function isPinned(): bool
    {
        return $this->is_pinned;
    }

    public function setIsPinned(bool $is_pinned): static
    {
        $this->is_pinned = $is_pinned;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updated_at;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updated_at): static
    {
        $this->updated_at = $updated_at;

        return $this;
    }
}
