<?php

namespace App\Repository;

use App\Entity\JournalTag;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<JournalTag>
 */
class JournalTagRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, JournalTag::class);
    }

    public function save(JournalTag $tag, bool $flush = true): void
    {
        $this->getEntityManager()->persist($tag);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(JournalTag $tag, bool $flush = true): void
    {
        $this->getEntityManager()->remove($tag);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Tags de l'utilisateur triés par nom, avec le nombre de posts racines associés.
     * Sans code PIN, seuls les posts publics sont comptés.
     *
     * @return array<int, array{tag: JournalTag, postCount: int}>
     */
    public function findWithPostCounts(User $owner, bool $includePrivate): array
    {
        $condition = 'p.parent IS NULL' . ($includePrivate ? '' : ' AND p.is_private = false');

        $rows = $this->createQueryBuilder('t')
            ->select('t AS tag', 'COUNT(p.id) AS postCount')
            ->leftJoin('t.posts', 'p', 'WITH', $condition)
            ->andWhere('t.owner = :owner')
            ->setParameter('owner', $owner->getId(), UuidType::NAME)
            ->groupBy('t.id')
            ->orderBy('t.name', 'ASC')
            ->getQuery()
            ->getResult();

        return array_map(
            static fn(array $row): array => ['tag' => $row['tag'], 'postCount' => (int) $row['postCount']],
            $rows,
        );
    }

    /**
     * Tags de l'utilisateur parmi une liste d'identifiants (les identifiants inconnus ou d'un autre compte sont ignorés).
     *
     * @param string[] $ids
     *
     * @return JournalTag[]
     */
    public function findOwnedByIds(User $owner, array $ids): array
    {
        $uuids = array_values(array_filter(array_map(
            static fn(mixed $id): ?Uuid => is_string($id) && Uuid::isValid($id) ? Uuid::fromString($id) : null,
            $ids,
        )));

        if ($uuids === []) {
            return [];
        }

        return $this->createQueryBuilder('t')
            ->andWhere('t.owner = :owner')
            ->andWhere('t.id IN (:ids)')
            ->setParameter('owner', $owner->getId(), UuidType::NAME)
            ->setParameter('ids', array_map(static fn(Uuid $uuid): string => $uuid->toBinary(), $uuids))
            ->getQuery()
            ->getResult();
    }

    public function slugExistsForOwner(User $owner, string $slug, ?Uuid $excludeId = null): bool
    {
        $qb = $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->andWhere('t.owner = :owner')
            ->andWhere('t.slug = :slug')
            ->setParameter('owner', $owner->getId(), UuidType::NAME)
            ->setParameter('slug', $slug);

        if ($excludeId !== null) {
            $qb->andWhere('t.id != :excludeId')->setParameter('excludeId', $excludeId, UuidType::NAME);
        }

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }
}
