import { styled } from 'styled-components';

/** Deux champs côte à côte, empilés sous le point de rupture `sm`. */
export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  ${({ theme }) => theme.media.down('sm')} {
    grid-template-columns: 1fr;
  }
`;
