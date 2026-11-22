<?php

namespace App\Doctrine\Query;

use Doctrine\ORM\Query\AST\Functions\FunctionNode;
use Doctrine\ORM\Query\AST\Node;
use Doctrine\ORM\Query\Parser;
use Doctrine\ORM\Query\SqlWalker;
use Doctrine\ORM\Query\TokenType;

/**
 * Fonction DQL DATE_FORMAT(date, format) — MySQL uniquement.
 *
 * Utilisée par l'onglet « Souvenirs » du journal : DATE_FORMAT(p.created_at, '%m-%d') = :monthDay.
 */
final class DateFormat extends FunctionNode
{
    private Node $date;
    private Node $format;

    public function parse(Parser $parser): void
    {
        $parser->match(TokenType::T_IDENTIFIER);
        $parser->match(TokenType::T_OPEN_PARENTHESIS);
        $this->date = $parser->ArithmeticPrimary();
        $parser->match(TokenType::T_COMMA);
        $this->format = $parser->StringPrimary();
        $parser->match(TokenType::T_CLOSE_PARENTHESIS);
    }

    public function getSql(SqlWalker $sqlWalker): string
    {
        return sprintf(
            'DATE_FORMAT(%s, %s)',
            $sqlWalker->walkArithmeticPrimary($this->date),
            $sqlWalker->walkStringPrimary($this->format),
        );
    }
}
