import './App.css';
import {
  useState,
  useMemo,
  SyntheticEvent,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  EditorRef,
  UsjNodeOptions,
  Marginal,
} from '@biblionexus-foundation/platform-editor';
import { getViewOptions } from '@biblionexus-foundation/platform-editor';
import { DEFAULT_VIEW_MODE } from '@biblionexus-foundation/platform-editor';
import { immutableNoteCallerNodeName } from '@biblionexus-foundation/platform-editor';
import { BookCode, Usj } from '@biblionexus-foundation/scripture-utilities';
import { usfmToUsj, usjToUsfm } from './utils';
import debounce from 'lodash/debounce';
// import editorTheme from './editor.theme';
// import { editorTheme } from './editor.theme';

const vscode = acquireVsCodeApi();

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
  const [usj, setUsj] = useState<Usj | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialRender, setInitialRender] = useState(true);
  const [scrRef, setScrRef] = useState(defaultScrRef);
  const [viewMode] = useState(DEFAULT_VIEW_MODE);
  const editorRef = useRef<EditorRef>(null!);
  const [codexFiles, setCodexFiles] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'updateCodexFiles':
          setCodexFiles(message.files);
          break;
        case 'updateUsfm':
          setIsLoading(true);
          setError(null);
          try {
            const { usj: newUsj, error: conversionError } = await usfmToUsj(
              `\\id ${message.bookName} ${message.fileName}\n` + message.usfm,
              // `\\id HAB 45HABGNT92.usfm, Good News Translation, June 2003
              // \\c 3
              // \\s1 A Prayer of Habakkuk
              // \\p
              // \\v 1 This is a prayer of the prophet Habakkuk:
              // \\b
              // \\q1
              // \\v 2 O \\nd Lord\\nd*, I have heard of what you have done,
              // \\q2 and I am filled with awe.
              // \\q1 Now do again in our times
              // \\q2 the great deeds you used to do.
              // \\q1 Be merciful, even when you are angry.`,
            );
            console.log({ newUsj, error: conversionError });
            if (conversionError) {
              throw new Error(conversionError);
            }
            if (newUsj) {
              setUsj(newUsj);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setIsLoading(false);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ command: 'getCodexFiles' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleCodexSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCodex = e.target.value;
    if (selectedCodex) {
      vscode.postMessage({ command: 'selectCodex', codexPath: selectedCodex });
    }
  };

  const nodeOptions: UsjNodeOptions = {
    [immutableNoteCallerNodeName]: {
      onClick: (e: SyntheticEvent) => {
        console.log({ e });
      },
    },
  };

  const viewOptions = useMemo(() => getViewOptions(viewMode), [viewMode]);

  const debouncedSendUsfm = useCallback(
    debounce(async (newUsj: Usj) => {
      const { usfm: newUsfm } = await usjToUsfm(newUsj);
      if (newUsfm) {
        vscode.postMessage({ command: 'updateUsfm', usfm: newUsfm });
      }
    }, 1000),
    [usj, viewMode],
  );

  const onChange = async (newUsj: Usj) => {
    if (initialRender) {
      setInitialRender(false);
      return;
    }

    setUsj(newUsj);
    debouncedSendUsfm(newUsj);
  };

  const handleSave = async () => {
    if (usj) {
      const { usfm: newUsfm } = await usjToUsfm(usj);
      if (newUsfm) {
        vscode.postMessage({ command: 'updateUsfm', usfm: newUsfm });
      }
    }
  };

  useEffect(() => {
    if (scrRef) {
      console.log('scrRef', scrRef);
    }
  }, [scrRef]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <select onChange={handleCodexSelection}>
        <option value="">Select a Codex file</option>
        {codexFiles.map((file, index) => (
          <option key={index} value={file}>
            {file.split('/').pop()}
          </option>
        ))}
      </select>
      <button onClick={handleSave}>Save</button>
      {/* <div style={{ whiteSpace: 'pre-wrap', color: 'red' }}>{debugString}</div> */}
      <Marginal
        // editorConfig={editorTheme}
        defaultUsj={usj || defaultUsj}
        ref={editorRef}
        onChange={onChange}
        // viewOptions={viewOptions}
        // nodeOptions={nodeOptions}
        options={{
          /** Options to configure the editor. */
          /** Is the editor readonly or editable. */
          isReadonly: false,
          /** Is the editor enabled for spell checking. */
          hasSpellCheck: true,
          /** Text direction. */
          textDirection: 'ltr',
          /** View options. */
          view: viewOptions,
          /** Options for each editor node:
           * @param nodes.ImmutableNoteCallerNode.noteCallers - Possible note callers to use when caller is '+'.
           * @param nodes.ImmutableNoteCallerNode.onClick - Click handler method.
           */
          nodes: nodeOptions,
        }}
        scrRef={scrRef}
        setScrRef={setScrRef}
      />
    </div>
  );
}

export default App;
