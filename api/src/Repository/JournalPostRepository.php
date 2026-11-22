<?php

namespace App\Repository;

use App\Entity\JournalPost;
use App\Entity\User;
use App\Enum\JournalTabEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<JournalPost>
 */
class JournalPostRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, JournalPost::class);
    }

    public function save(JournalPost $post, bool $flush = true): void
    {
        $this->getEntityManager()->persist($post);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(JournalPost $post, bool $flush = true): void
    {
        $this->getEntityManager()->remove($post);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Posts racines d'un onglet, triés épinglés d'abord puis du plus récent au plus ancien.
     *
     * @return JournalPost[]
     */
    public function findRootPostsForTab(
        User $owner,
        JournalTabEnum $tab,
        \DateTimeImmutable $now,
        ?string $tagSlug = null,
        ?string $search = null,
    ): array {
        $qb = $this->createTabQueryBuilder($owner, $tab, $now)
            ->select('p')
            ->orderBy('p.is_pinned', 'DESC')
            ->addOrderBy('p.created_at', 'DESC');

        if ($tagSlug !== null && $tagSlug !== '') {
            $qb->innerJoin('p.tags', 'filterTag', 'WITH', 'filterTag.slug = :tagSlug')
                ->setParameter('tagSlug', $tagSlug);
        }

        if ($search !== null && trim($search) !== '') {
            // Recherche dans le post et dans ses suites
            $qb->andWhere(
                $qb->expr()->orX(
                    'p.content LIKE :search',
                    sprintf('EXISTS (SELECT 1 FROM %s r WHERE r.parent = p AND r.content LIKE :search)', JournalPost::class),
                )
            )->setParameter('search', '%' . addcslashes(trim($search), '%_') . '%');
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Nombre de posts racines d'un onglet (badges des onglets).
     */
    public function countRootPostsForTab(User $owner, JournalTabEnum $tab, \DateTimeImmutable $now): int
    {
        return (int) $this->createTabQueryBuilder($owner, $tab, $now)
            ->select('COUNT(p.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    private function createTabQueryBuilder(User $owner, JournalTabEnum $tab, \DateTimeImmutable $now): QueryBuilder
    {
        $qb = $this->createQueryBuilder('p')
            ->andWhere('p.owner = :owner')
            ->andWhere('p.parent IS NULL')
            ->andWhere('p.is_private = :isPrivate')
            ->setParameter('owner', $owner->getId(), UuidType::NAME)
            ->setParameter('isPrivate', $tab === JournalTabEnum::Private);

        match ($tab) {
            JournalTabEnum::Memories => $qb
                // Même jour et même mois, lors d'une année antérieure
                ->andWhere("DATE_FORMAT(p.created_at, '%m-%d') = :monthDay")
                ->andWhere('p.created_at < :startOfYear')
                ->setParameter('monthDay', $now->format('m-d'))
                ->setParameter('startOfYear', $now->setDate((int) $now->format('Y'), 1, 1)->setTime(0, 0)),
            JournalTabEnum::Bookmarks => $qb->andWhere('p.is_bookmarked = true'),
            JournalTabEnum::Feed, JournalTabEnum::Private => $qb,
        };

        return $qb;
    }
}
