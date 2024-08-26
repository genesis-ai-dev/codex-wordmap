import './App.css';
import { useState, useMemo, SyntheticEvent, useRef, useEffect } from 'react';
import { Editor, EditorRef } from '@biblionexus-foundation/scribe-editor';
import { getViewOptions } from '@biblionexus-foundation/scribe-editor';
import { DEFAULT_VIEW_MODE } from '@biblionexus-foundation/scribe-editor';
import { UsjNodeOptions } from '@biblionexus-foundation/scribe-editor';
import { immutableNoteCallerNodeName } from '@biblionexus-foundation/scribe-editor';
import { BookCode, Usj } from '@biblionexus-foundation/scripture-utilities';

// Default USJ structure for initializing the editor
const defaultUsj: Usj = {
  type: 'USJ',
  version: '0.2.1',
  content: [],
};

// Interface defining the structure for a scripture reference
export interface ScriptureReference {
  bookCode: BookCode;
  chapterNum: number;
  verseNum: number;
}

// Default scripture reference, set to Psalms 1:1
const defaultScrRef: ScriptureReference = {
  /* PSA */ bookCode: 'PSA',
  chapterNum: 1,
  verseNum: 1,
};

function App() {
  // State for managing the USJ content
  const [usj, setUsj] = useState<Usj | undefined>();
  // State to track if it's the initial render
  const [initialRender, setInitialRender] = useState(true);
  // State for managing the current scripture reference
  const [scrRef, setScrRef] = useState(defaultScrRef);
  // State for managing the view mode of the editor
  const [viewMode] = useState(DEFAULT_VIEW_MODE);

  // Ref for accessing the Editor component
  const editorRef = useRef<EditorRef>(null!);
  // Ref for storing the previous USJ state 
  const previousUsjRef = useRef<Usj | null>(null);

  // Effect to update the editor's USJ content when it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (usj && editorRef.current) {
        editorRef.current.setUsj(usj);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [usj]);

  // Options for handling node interactions in the editor
  const nodeOptions: UsjNodeOptions = {
    [immutableNoteCallerNodeName]: {
      onClick: (e: SyntheticEvent) => {
        console.log({ e });
      },
    },
  };

  // Memoized view options based on the current view mode
  const viewOptions = useMemo(() => getViewOptions(viewMode), [viewMode]);

  // Handler for USJ content changes in the editor
  const onChange = async (newUsj: Usj) => {
    if (initialRender) {
      setInitialRender(false);
      return;
    }
    
    // Store the current USJ in previousUsjRef before updating
    previousUsjRef.current = usj || null;
    
    setUsj(newUsj);
    
    // Example usage of previousUsjRef (you can modify this based on your needs)
    console.log('Previous USJ:', previousUsjRef.current);
    console.log('New USJ:', newUsj);
  };

  // Effect to log scripture reference changes (for debugging purposes)
  useEffect(() => {
    if (scrRef) {
      console.log('scrRef', scrRef);
    }
  }, [scrRef]);

  return (
    <div>
      <Editor
        usjInput={defaultUsj}
        ref={editorRef}
        onChange={onChange}
        viewOptions={viewOptions}
        nodeOptions={nodeOptions}
        scrRef={scrRef}
        setScrRef={setScrRef}
      />
    </div>
  );
}

export default App;
