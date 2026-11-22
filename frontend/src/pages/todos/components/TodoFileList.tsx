import { TodoFile } from '@/types/todo.types';
import { getFileIcon } from '@/utils';
import { Button, Icon, IconButton, Link } from 'core-react/ui';
import React, { useRef } from 'react';
import { styled } from 'styled-components';

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1.5]};
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
  padding: 0;
  list-style: none;
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[1.5]} ${theme.spacing[1.5]} ${theme.spacing[3]}`};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.background.body};
`;

const FileName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 0;
  font-size: ${({ theme }) => theme.typography.sizes.sm};

  a {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

/** Pièces jointes d'une tâche. La suppression est confiée au parent (un seul appel API). */
export const TodoFileList: React.FC<{
  files: TodoFile[];
  onUpload: (files: FileList) => void;
  onDelete: (fileId: string) => void;
}> = ({ files, onUpload, onDelete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {files.length > 0 && (
        <List>
          {files.map((file) => (
            <Item key={file.id}>
              <FileName>
                <Icon name={getFileIcon(file)} size={18} title={file.type ?? undefined} />
                <Link href={file.filePath} target="_blank" rel="noopener noreferrer">
                  {file.originalName}
                </Link>
              </FileName>
              <IconButton
                name="trash-can-outline"
                variant="ghost"
                size="sm"
                aria-label={`Supprimer ${file.originalName}`}
                onClick={() => onDelete(file.id)}
              />
            </Item>
          ))}
        </List>
      )}

      <HiddenInput
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />
      <Button type="button" $variant="outline" $size="sm" onClick={() => fileInputRef.current?.click()}>
        <Icon name="paperclip" size={16} />
        Ajouter un fichier
      </Button>
    </div>
  );
};
