<?php

namespace App\DataFixtures;

use App\Entity\JournalLocation;
use App\Entity\JournalPost;
use App\Entity\JournalTag;
use App\Entity\Tag;
use App\Entity\Todo;
use App\Entity\TodoComment;
use App\Entity\TodoFile;
use App\Entity\User;
use App\Enum\Auth\RoleEnum;
use App\Enum\ColorEnum;
use App\Enum\MoodEnum;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Fagathe\CorePhp\Generator\TokenGenerator;
use Faker\Factory;
use Faker\Generator;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\String\Slugger\AsciiSlugger;

/**
 * Jeu de données de développement.
 *
 * 23 à 45 utilisateurs. Comptes fixes : test@example.com (testuser) et le compte admin (admin), dont l'adresse vient de
 * FIXTURES_ADMIN_EMAIL (admin@example.com si la variable est vide) ; mot de passe « Password123! », code secret
 * du journal « 0000 » ; protection du privé par code désactivée pour l'admin et pour ~80 % des autres comptes.
 * Chaque utilisateur reçoit (volumes +25 % par rapport au jeu initial) :
 *  - 5 à 8 tags, dont 1 à 2 jamais utilisés par une tâche (le filtre de la page Tâches doit les masquer) ;
 *  - 19 à 31 tâches (échéances variées, commentaires, pièces jointes réelles dans public/uploads/todos/) ;
 *  - 5 à 8 tags de journal et 19 à 31 posts Markdown (~70 % publics, ~30 % privés), avec épinglés,
 *    enregistrés, souvenirs (même jour il y a 1 et 2 ans) et fils de suites.
 */
class AppFixtures extends Fixture
{
    private const DEFAULT_PASSWORD = 'Password123!';
    private const DEFAULT_PASSCODE = '0000';
    private const FALLBACK_ADMIN_EMAIL = 'admin@example.com';

    private const JOURNAL_TAGS = [
        ['Quotidien', ColorEnum::Blue],
        ['Idées', ColorEnum::Yellow],
        ['Sport', ColorEnum::Green],
        ['Humeur', ColorEnum::Pink],
        ['Projets', ColorEnum::Purple],
        ['Lecture', ColorEnum::Orange],
        ['Voyages', ColorEnum::Cyan],
        ['Famille', ColorEnum::Red],
    ];

    private const CITIES = [
        ['Paris', 'France', 48.8566, 2.3522],
        ['Lyon', 'France', 45.7640, 4.8357],
        ['Bordeaux', 'France', 44.8378, -0.5792],
        ['Marseille', 'France', 43.2965, 5.3698],
        ['Fort-de-France', 'Martinique', 14.6161, -61.0588],
    ];

    private Filesystem $filesystem;
    private AsciiSlugger $slugger;

    public function __construct(
        private readonly UserPasswordHasherInterface $hasher,
        private readonly TokenGenerator $tokenGenerator,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
        #[Autowire('%env(DEFAULT_URI)%')]
        private readonly string $defaultUri,
        // Adresse du compte admin des fixtures (renseignée dans .env.local, vide dans .env)
        #[Autowire('%env(default::FIXTURES_ADMIN_EMAIL)%')]
        private readonly ?string $adminEmail = null,
    ) {
        $this->filesystem = new Filesystem();
        $this->slugger = new AsciiSlugger();
    }

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');
        $passcodeHash = password_hash(self::DEFAULT_PASSCODE, PASSWORD_BCRYPT);
        $now = new \DateTimeImmutable();

        $userCount = random_int(23, 45); // +50 % par rapport au jeu initial (15 à 30)
        for ($i = 0; $i < $userCount; $i++) {
            $user = $this->createUser($faker, $i, $passcodeHash);
            $manager->persist($user);

            $tags = $this->createTags($manager, $faker, $user);
            $this->createTodos($manager, $faker, $user, $tags);

            $journalTags = $this->createJournalTags($manager, $faker, $user);
            $this->createJournalPosts($manager, $faker, $user, $journalTags, $now);

            // Libère la mémoire régulièrement (beaucoup de posts et de tâches)
            $manager->flush();
        }

        $manager->flush();
    }

    private function createUser(Generator $faker, int $index, string $passcodeHash): User
    {
        $user = new User();

        match ($index) {
            0 => $user->setEmail('test@example.com')->setUsername('testuser')->setFirstname('Test')->setLastname('User')
                ->setCreatedAt(new \DateTimeImmutable('-2 years -1 month')),
            1 => $user->setEmail(trim((string) $this->adminEmail) ?: self::FALLBACK_ADMIN_EMAIL)->setUsername('admin')->setFirstname('Admin')->setLastname('User')
                ->setCreatedAt(new \DateTimeImmutable('-2 years -1 month')),
            default => $user
                ->setEmail($faker->unique()->safeEmail())
                ->setUsername(substr($faker->unique()->userName() . $index, 0, 30))
                ->setFirstname($faker->firstName())
                ->setLastname($faker->lastName())
                ->setCreatedAt(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-3 years', '-1 year'))),
        };

        return $user
            ->setRoles([$index === 1 ? RoleEnum::RoleAdmin->value : RoleEnum::RoleUser->value])
            ->setPassword($this->hasher->hashPassword($user, self::DEFAULT_PASSWORD))
            ->setJournalPasscode($passcodeHash)
            // Protection du privé : désactivée pour l'admin, active pour ~20 % des autres comptes (random_choices de core-php)
            ->setJournalLockEnabled($index === 1 ? false : random_choices([false, true], [80, 20]))
            ->setIsVerified(true)
            ->setEmailVerifiedAt(new \DateTimeImmutable())
            ->setJCodeToken($this->tokenGenerator->generate(80));
    }

    /**
     * 4 à 6 tags de couleurs distinctes (contrainte unique owner + color). Le tableau renvoyé sépare
     * les tags utilisés par les tâches de ceux qui ne le seront jamais.
     *
     * @return array{used: Tag[], unused: Tag[]}
     */
    private function createTags(ObjectManager $manager, Generator $faker, User $user): array
    {
        $colors = ColorEnum::cases();
        shuffle($colors);

        $names = ['Travail', 'Maison', 'Courses', 'Santé', 'Administratif', 'Famille', 'Urgent', 'Perso', 'Projets', 'Loisirs'];
        shuffle($names);

        $total = $faker->numberBetween(5, 8);
        $unusedCount = $faker->numberBetween(1, 2);
        $tags = ['used' => [], 'unused' => []];

        for ($t = 0; $t < $total; $t++) {
            $tag = (new Tag())
                ->setName($names[$t])
                ->setDescription($faker->optional(0.6)->sentence())
                ->setColor(array_pop($colors))
                ->setCreatedAt(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-6 months', '-1 week')));

            $user->addTag($tag);
            $manager->persist($tag);
            $tags[$t < $total - $unusedCount ? 'used' : 'unused'][] = $tag;
        }

        return $tags;
    }

    /**
     * @param array{used: Tag[], unused: Tag[]} $tags
     */
    private function createTodos(ObjectManager $manager, Generator $faker, User $user, array $tags): void
    {
        $parisTz = new \DateTimeZone('Europe/Paris');
        $count = $faker->numberBetween(19, 31);

        for ($j = 0; $j < $count; $j++) {
            // Échéances variées : en retard, aujourd'hui, demain, cette semaine, plus tard, ou aucune
            $dueDate = match ($faker->numberBetween(0, 5)) {
                0 => null,
                1 => new \DateTimeImmutable('today', $parisTz),
                2 => new \DateTimeImmutable('tomorrow', $parisTz),
                3 => \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-6 days', '-1 day')),
                4 => \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('+2 days', '+6 days')),
                default => \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('+1 week', '+1 month')),
            };

            $createdAt = \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-1 month', '-1 hour'));
            $todo = (new Todo())
                ->setName(rtrim($faker->sentence($faker->numberBetween(3, 6)), '.'))
                ->setDescription($faker->optional(0.6)->paragraph(2))
                ->setIsDone($faker->boolean(30))
                ->setDueDate($dueDate?->setTimezone($parisTz)->setTime(23, 59, 59))
                ->setCreatedAt($createdAt);

            // Tous les tags « used » sont garantis d'avoir au moins une tâche (les premières tâches les reçoivent)
            if ($j < count($tags['used'])) {
                $todo->setTag($tags['used'][$j]);
            } elseif ($faker->boolean(65)) {
                $todo->setTag($faker->randomElement($tags['used']));
            }

            $user->addTodo($todo);
            $manager->persist($todo);

            for ($c = 0, $comments = $faker->optional(0.4, 0)->numberBetween(1, 4); $c < $comments; $c++) {
                $comment = (new TodoComment())
                    ->setContent($faker->sentence($faker->numberBetween(6, 16)))
                    ->setOwner($user)
                    ->setCreatedAt(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween($createdAt->format('Y-m-d H:i:s'), 'now')));
                $todo->addComment($comment);
                $manager->persist($comment);
            }

            if ($faker->boolean(25)) {
                $file = $this->createTodoAttachment($faker, $user, $todo);
                $todo->addFile($file);
                $manager->persist($file);
            }
        }
    }

    /**
     * Écrit un vrai fichier Markdown dans public/uploads/todos/<userId>/ pour que la pièce jointe soit téléchargeable.
     */
    private function createTodoAttachment(Generator $faker, User $user, Todo $todo): TodoFile
    {
        $title = (string) $todo->getName();
        $fileName = sprintf('%s-%s.md', $this->slugger->slug($title)->lower()->truncate(40), bin2hex(random_bytes(4)));
        $relativePath = sprintf('uploads/todos/%s/%s', $user->getId(), $fileName);
        $content = sprintf("# %s\n\n%s\n\n- %s\n- %s\n", $title, $faker->paragraph(3), $faker->sentence(), $faker->sentence());

        $this->filesystem->dumpFile(sprintf('%s/public/%s', $this->projectDir, $relativePath), $content);

        return (new TodoFile())
            ->setOriginalName($fileName)
            ->setFilePath(sprintf('%s/%s', rtrim($this->defaultUri, '/'), $relativePath))
            ->setMimeType('text/markdown')
            ->setExtension('md')
            ->setSize(strlen($content))
            ->setType('Texte')
            ->setCreatedAt(new \DateTimeImmutable())
            ->setOwner($user);
    }

    /**
     * @return JournalTag[]
     */
    private function createJournalTags(ObjectManager $manager, Generator $faker, User $user): array
    {
        $definitions = self::JOURNAL_TAGS;
        shuffle($definitions);

        $tags = [];
        foreach (array_slice($definitions, 0, $faker->numberBetween(5, 8)) as [$name, $color]) {
            $tag = (new JournalTag())
                ->setName($name)
                ->setSlug($this->slugger->slug($name)->lower()->toString())
                ->setColor($color)
                ->setCreatedAt(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-2 years', '-1 month')));

            $user->addJournalTag($tag);
            $manager->persist($tag);
            $tags[] = $tag;
        }

        return $tags;
    }

    /**
     * @param JournalTag[] $tags
     */
    private function createJournalPosts(ObjectManager $manager, Generator $faker, User $user, array $tags, \DateTimeImmutable $now): void
    {
        $count = $faker->numberBetween(19, 31);
        $moods = MoodEnum::cases();

        // Dates des souvenirs : même jour et même mois, il y a 1 et 2 ans (onglet « Souvenirs »)
        $memoryDates = [
            $now->modify('-1 year')->setTime(9, 12),
            $now->modify('-2 years')->setTime(20, 45),
            $now->modify('-1 year')->setTime(18, 3),
        ];

        for ($p = 0; $p < $count; $p++) {
            $createdAt = $memoryDates[$p] ?? \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-10 months', '-1 hour'));
            // ~30 % de posts privés au total ; les souvenirs restent publics pour être visibles sans code
            $isPrivate = !isset($memoryDates[$p]) && $faker->boolean(36);

            $post = (new JournalPost())
                ->setContent($this->postContent($faker))
                ->setMood($faker->boolean(60) ? $faker->randomElement($moods) : null)
                ->setIsPinned($faker->boolean(10))
                ->setIsBookmarked($faker->boolean(20))
                ->setIsPrivate($isPrivate)
                ->setCreatedAt($createdAt);

            foreach ($faker->randomElements($tags, $faker->numberBetween(0, min(3, count($tags)))) as $tag) {
                $post->addTag($tag);
            }

            if ($faker->boolean(25)) {
                $post->setLocation($this->createLocation($faker, $user, $createdAt));
            }

            $user->addJournalPost($post);
            $manager->persist($post);

            // ~30 % des posts reçoivent 1 à 3 suites (fil de mise à jour)
            if ($faker->boolean(30)) {
                $replyAt = $createdAt;
                for ($r = 0, $replies = $faker->numberBetween(1, 4); $r < $replies; $r++) {
                    $replyAt = $replyAt->modify(sprintf('+%d hours', $faker->numberBetween(2, 72)));
                    if ($replyAt > $now) {
                        break;
                    }

                    $reply = (new JournalPost())
                        ->setContent($this->replyContent($faker))
                        ->setMood($faker->boolean(30) ? $faker->randomElement($moods) : null)
                        ->setIsPrivate($isPrivate)
                        ->setCreatedAt($replyAt);

                    $post->addReply($reply);
                    $user->addJournalPost($reply);
                    $manager->persist($reply);
                }
            }
        }
    }

    private function createLocation(Generator $faker, User $user, \DateTimeImmutable $createdAt): JournalLocation
    {
        [$city, $country, $lat, $lng] = $faker->randomElement(self::CITIES);

        return (new JournalLocation())
            ->setOwner($user)
            ->setName(sprintf('%s, %s', $city, $country))
            ->setCity($city)
            ->setCountry($country)
            ->setStreet($faker->optional(0.5)->streetAddress())
            ->setLatitude($lat + $faker->randomFloat(4, -0.02, 0.02))
            ->setLongitude($lng + $faker->randomFloat(4, -0.02, 0.02))
            ->setCreatedAt($createdAt);
    }

    /**
     * Post Markdown réaliste : titre optionnel, paragraphes, liste, citation, gras/italique.
     */
    private function postContent(Generator $faker): string
    {
        $templates = [
            fn(): string => sprintf("Belle journée aujourd'hui. **%s**\n\n%s", $faker->sentence(), $faker->paragraph(3)),
            fn(): string => sprintf("## %s\n\n%s\n\n- %s\n- %s\n- %s", rtrim($faker->sentence(4), '.'), $faker->paragraph(2), $faker->sentence(), $faker->sentence(), $faker->sentence()),
            fn(): string => sprintf("Séance de sport : *%d minutes* de %s.\n\n%s", $faker->numberBetween(20, 90), $faker->randomElement(['course', 'natation', 'vélo', 'renforcement', 'yoga']), $faker->paragraph(2)),
            fn(): string => sprintf("> %s\n\nCette phrase m'a marqué en lisant *%s*. %s", $faker->sentence(12), rtrim($faker->sentence(3), '.'), $faker->paragraph(2)),
            fn(): string => sprintf("Idée du jour : %s\n\n1. %s\n2. %s\n3. %s", lcfirst($faker->sentence()), $faker->sentence(), $faker->sentence(), $faker->sentence()),
            fn(): string => sprintf("%s\n\n%s", $faker->paragraph(4), $faker->paragraph(2)),
            fn(): string => sprintf("Avancée sur le projet **%s** : %s\n\nProchaine étape : `%s`.", ucfirst($faker->word()), lcfirst($faker->sentence(10)), $faker->slug(3)),
        ];

        return $faker->randomElement($templates)();
    }

    private function replyContent(Generator $faker): string
    {
        return $faker->randomElement([
            sprintf('Mise à jour : %s', lcfirst($faker->sentence(12))),
            sprintf("Finalement, %s\n\n%s", lcfirst($faker->sentence(10)), $faker->sentence()),
            sprintf('**Suite** — %s', $faker->paragraph(2)),
        ]);
    }
}
