import { ColorEnum, tagColors } from '@/types/tag.types';
import styled from 'styled-components';

const FormRoot = styled.form<{ $color?: ColorEnum | null }>`
  display: flex;
  flex-direction: column;
  background-color: ${({ $color, theme }) =>
    $color ? `${tagColors[$color as keyof typeof tagColors]}10` : theme.colors.background.surface};
  border: 1px solid
    ${({ $color, theme }) =>
      $color ? `${tagColors[$color as keyof typeof tagColors]}40` : theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  width: 100%;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const TitleField = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 20px;
  font-weight: 700;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.heading};

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

const EditorArea = styled.div`
  padding: 20px;
`;

const PreviewArea = styled.div`
  padding: 24px 20px;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ToolSquareBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: none;
  box-shadow: none;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.heading};
  font-size: 20px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    transform 0.1s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.08);
  }
`;

const FormError = styled.div`
  padding: 0 20px 12px;
`;

export { EditorArea, FormError, FormRoot, PreviewArea, TitleField, Toolbar, ToolGroup, ToolSquareBtn, TopBar };
