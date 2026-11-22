import { getErrorMessage } from '@/services/apiError';
import { fetchLogFile, fetchLogTree } from '@/services/log.api';
import { LogDate, LogEntry, LogLevel } from '@/types/log.types';
import { PageHeader } from '@/components/PageHeader';
import { Accordion, Alert, Badge, Button, Card, EmptyState, Icon, Input, Loading, SegmentedControl, Select, Title } from 'core-react/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { styled } from 'styled-components';
import { LogEntryItem } from './components/LogEntryItem';
import { formatLogDate, LOG_LEVELS } from './components/logFormat';
import { LogTree } from './components/LogTree';

type LevelFilter = 'all' | LogLevel;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const FilePath = styled(Title)`
  margin-bottom: 0;
  font-size: ${({ theme }) => theme.typography.sizes.lg};
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  min-width: 0;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const SearchInput = styled(Input)`
  flex: 1 1 220px;
`;

const FileTitle = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 0;
  overflow-wrap: anywhere;
`;

const CenteredBox = styled.div`
  display: grid;
  place-items: center;
  height: 160px;
`;

const LEVEL_OPTIONS: Array<{ value: LevelFilter; label: string }> = [
  { value: 'all', label: 'Tous' },
  ...LOG_LEVELS.map((level) => ({ value: level, label: level.charAt(0).toUpperCase() + level.slice(1) })),
];

export const LogsPage = () => {
  const [tree, setTree] = useState<LogDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');
  const [isTreeLoading, setIsTreeLoading] = useState(true);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    try {
      setIsTreeLoading(true);
      const data = await fetchLogTree();
      setTree(data);
      // Conserve la date sélectionnée si elle existe toujours
      setSelectedDate((current) =>
        current && data.some((d) => d.date === current) ? current : (data[0]?.date ?? null)
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors de la récupération des logs.'));
    } finally {
      setIsTreeLoading(false);
    }
  }, []);

  const loadFile = useCallback(async (date: string, path: string) => {
    try {
      setIsFileLoading(true);
      setError(null);
      setLogs(await fetchLogFile(date, path));
    } catch (err) {
      setLogs([]);
      setError(getErrorMessage(err, 'Erreur lors de la lecture du fichier de log.'));
    } finally {
      setIsFileLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadTree();
    };
    init();
  }, [loadTree]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedPath(null);
    setLogs([]);
  };

  const handleSelectFile = (path: string) => {
    if (!selectedDate) return;
    setSelectedPath(path);
    setLevelFilter('all');
    setSearch('');
    loadFile(selectedDate, path);
  };

  const handleRefresh = async () => {
    await loadTree();
    if (selectedDate && selectedPath) await loadFile(selectedDate, selectedPath);
  };

  const currentDate = tree.find((d) => d.date === selectedDate) ?? null;

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (!term) return true;
      return JSON.stringify([log.content, log.context]).toLowerCase().includes(term);
    });
  }, [logs, levelFilter, search]);

  return (
    <Container>
      <PageHeader
        title="Logs de l'API"
        description="Journaux JSON générés par le Logger, groupés par date et par fichier."
        icon="text-box-search-outline"
        actions={
          <Button type="button" $variant="outline" onClick={handleRefresh} $loading={isTreeLoading || isFileLoading}>
            <Icon name="restore" size={16} />
            Actualiser
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {isTreeLoading && tree.length === 0 ? (
        <CenteredBox>
          <Loading size="lg" />
        </CenteredBox>
      ) : tree.length === 0 ? (
        <EmptyState icon="text-box-search-outline" title="Aucun log" description="Aucun fichier de log n'a été trouvé." />
      ) : (
        <Layout>
          <Card>
            <Panel>
              <Select
                aria-label="Date des logs"
                value={selectedDate ?? ''}
                onChange={(e) => handleDateChange(e.target.value)}
              >
                {tree.map(({ date, count }) => (
                  <option key={date} value={date}>
                    {formatLogDate(date)} ({count})
                  </option>
                ))}
              </Select>

              {currentDate && (
                <LogTree
                  key={currentDate.date}
                  nodes={currentDate.items}
                  selectedPath={selectedPath}
                  onSelect={handleSelectFile}
                />
              )}
            </Panel>
          </Card>

          <Card>
            <Panel>
              {!selectedPath ? (
                <EmptyState
                  icon="file-document-outline"
                  title="Aucun fichier sélectionné"
                  description="Choisissez un fichier de log dans l'arborescence."
                />
              ) : (
                <>
                  <FileTitle>
                    <FilePath as="h2">{selectedPath.replaceAll('.', ' / ')}</FilePath>
                    <Badge $variant="neutral" $pill>
                      {filteredLogs.length} / {logs.length}
                    </Badge>
                  </FileTitle>

                  <Toolbar>
                    <SegmentedControl
                      aria-label="Filtrer par niveau"
                      size="sm"
                      options={LEVEL_OPTIONS}
                      value={levelFilter}
                      onChange={setLevelFilter}
                    />
                    <SearchInput
                      type="search"
                      placeholder="Rechercher (message, action, données…)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </Toolbar>

                  {isFileLoading ? (
                    <CenteredBox>
                      <Loading size="lg" />
                    </CenteredBox>
                  ) : filteredLogs.length === 0 ? (
                    <EmptyState icon="filter-off-outline" title="Aucune entrée" description="Aucun log ne correspond aux filtres." />
                  ) : (
                    <Accordion multiple key={`${selectedDate}-${selectedPath}`}>
                      {filteredLogs.map((log, index) => {
                        const itemKey = `${log.id ?? 'log'}-${index}`;
                        return <LogEntryItem key={itemKey} itemKey={itemKey} log={log} />;
                      })}
                    </Accordion>
                  )}
                </>
              )}
            </Panel>
          </Card>
        </Layout>
      )}
    </Container>
  );
};
