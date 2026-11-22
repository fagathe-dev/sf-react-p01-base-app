<?php

namespace App\Entity;

use App\Repository\JournalMediaRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Média (image, vidéo, audio) attaché à un post, stocké dans public/uploads/journal/<userId>/.
 */
#[ORM\Entity(repositoryClass: JournalMediaRepository::class)]
#[ORM\Table(name: 'journal_media')]
#[ORM\Index(name: 'idx_journal_media_post', columns: ['post_id'])]
#[ORM\Index(name: 'idx_journal_media_owner', columns: ['owner_id'])]
class JournalMedia extends AbstractFile
{
    #[ORM\ManyToOne(inversedBy: 'medias')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?JournalPost $post = null;

    #[ORM\ManyToOne(inversedBy: 'journalMedia')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $owner = null;

    public function getPost(): ?JournalPost
    {
        return $this->post;
    }

    public function setPost(?JournalPost $post): static
    {
        $this->post = $post;

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
}
