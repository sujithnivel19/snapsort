import { useCallback, useState } from 'react';
import type { Photo, PhotoGroup, Screen } from './lib/types';
import { classifyIntoGroups } from './lib/classify';
import { ImportScreen } from './components/ImportScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { SummaryScreen } from './components/SummaryScreen';

function App() {
  const [screen, setScreen] = useState<Screen>('import');
  const [groups, setGroups] = useState<PhotoGroup[]>([]);

  const handleStart = useCallback(async (photos: Photo[]) => {
    setScreen('processing');
    const classified = await classifyIntoGroups(photos);
    setGroups(classified);
    setScreen('review');
  }, []);

  const handleReviewDone = useCallback((finalGroups: PhotoGroup[]) => {
    setGroups(finalGroups);
    setScreen('summary');
  }, []);

  const handleReset = useCallback(() => {
    setGroups([]);
    setScreen('import');
  }, []);

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#141210', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
      {screen === 'import' && <ImportScreen onStart={handleStart} />}
      {screen === 'processing' && <ProcessingScreen />}
      {screen === 'review' && <ReviewScreen groups={groups} onDone={handleReviewDone} />}
      {screen === 'summary' && <SummaryScreen groups={groups} onReset={handleReset} />}
    </div>
  );
}

export default App;
