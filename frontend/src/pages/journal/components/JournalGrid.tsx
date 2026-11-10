import styled from 'styled-components';

/** Grille en colonnes (masonry) des cartes du journal, partagée par la liste et son squelette de chargement */
export const JournalGrid = styled.div`
  columns: 3 320px;
  column-gap: 16px;
  width: 100%;

  @media (max-width: 1024px) {
    columns: 2 280px;
  }

  @media (max-width: 640px) {
    columns: 1;
  }
`;
