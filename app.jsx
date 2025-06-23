const { useState } = React;

// Simple icons
const ChevronDown = () => <span>▼</span>;
const ChevronRight = () => <span>▶</span>;
const Download = () => <span>⬇</span>;
const Upload = () => <span>⬆</span>;

function App() {
  const [lengthMode, setLengthMode] = useState('mini');
  const [minibook, setMinibook] = useState({
    title: '',
    subtitle: '',
    structure: 'sm',
    chapters: []
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const lengthGoals = {
    mini: { name: 'Mini', wordsPerPage: 250, pages: [1, 2] },
    expanded: { name: 'Expanded', wordsPerPage: 250, pages: [3, 5] },
    full: { name: 'Full', wordsPerPage: 250, pages: [6, 10] }
  };

  function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function getGoalWordsPerChapter() {
    const cfg = lengthGoals[lengthMode];
    const avgPages = (cfg.pages[0] + cfg.pages[1]) / 2;
    return Math.round(cfg.wordsPerPage * avgPages);
  }

  function getTotalWordCount() {
    return minibook.chapters.reduce((acc, ch) => {
      let w = countWords(ch.content || '');
      ch.subpoints.forEach(sp => {
        w += countWords(sp.content || '');
        sp.paragraphs.forEach(p => {
          w += countWords(p.content || '');
        });
      });
      return acc + w;
    }, 0);
  }

  function getReadingTime() {
    return Math.ceil(getTotalWordCount() / 200);
  }

  function getProgressColor(pct) {
    if (pct < 50 || pct > 150) return '#dc2626'; // red
    if (pct < 80 || pct > 120) return '#facc15'; // yellow
    return '#16a34a'; // green
  }

  const structures = {
    ws: {
      name: "W's Outline Model",
      chapters: [
        { id: '1.1', title: 'Who', subpoints: [] },
        { id: '1.2', title: 'What', subpoints: [] },
        { id: '1.3', title: 'When', subpoints: [] },
        { id: '1.4', title: 'Where', subpoints: [] },
        { id: '1.5', title: 'Why', subpoints: [] },
        { id: '1.6', title: 'How', subpoints: [] }
      ]
    },
    sequential: {
      name: 'Sequential Outline Model',
      chapters: Array.from({ length: 8 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Step ${i + 1}`,
        subpoints: []
      }))
    },
    problems: {
      name: '10 Problems Outline Model',
      chapters: Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Problem ${i + 1}`,
        subpoints: []
      }))
    }
  };

  function initializeStructure(type) {
    const base = structures[type];
    const processed = base.chapters.map(ch => ({
      ...ch,
      content: '',
      subpoints: Array.from({ length: 3 }, (_, i) => ({
        id: `${ch.id}.${i + 1}`,
        title: `Subpoint ${i + 1}`,
        content: '',
        paragraphs: Array.from({ length: 3 }, (_, j) => ({
          id: `${ch.id}.${i + 1}.${j + 1}`,
          title: `Paragraph ${j + 1}`,
          content: ''
        }))
      }))
    }));
    const intro = {
      id: '0',
      title: 'Introduction',
      content: '',
      subpoints: Array.from({ length: 3 }, (_, i) => ({
        id: `0.${i + 1}`,
        title: `Subpoint ${i + 1}`,
        content: '',
        paragraphs: Array.from({ length: 3 }, (_, j) => ({
          id: `0.${i + 1}.${j + 1}`,
          title: `Paragraph ${j + 1}`,
          content: ''
        }))
      }))
    };
    const chapters = [intro, ...processed];
    setMinibook(b => ({ ...b, structure: type, chapters }));
    setSelectedItem(null);
  }

  function updateContent(path, content) {
    setMinibook(b => {
      const copy = { ...b };
      if (path.type === 'chapter') {
        copy.chapters[path.c].content = content;
      } else if (path.type === 'subpoint') {
        copy.chapters[path.c].subpoints[path.s].content = content;
      } else {
        copy.chapters[path.c].subpoints[path.s].paragraphs[path.p].content = content;
      }
      return copy;
    });
  }

  function updateItemTitle(path, title) {
    setMinibook(b => {
      const copy = { ...b };
      if (path.type === 'chapter') {
        copy.chapters[path.c].title = title;
      } else if (path.type === 'subpoint') {
        copy.chapters[path.c].subpoints[path.s].title = title;
      } else {
        copy.chapters[path.c].subpoints[path.s].paragraphs[path.p].title = title;
      }
      return copy;
    });
  }

  function addSubpoint(ch) {
    setMinibook(b => {
      const copy = { ...b };
      const sp = copy.chapters[ch].subpoints;
      const id = `${copy.chapters[ch].id}.${sp.length + 1}`;
      sp.push({ id, title: `Subpoint ${sp.length + 1}`, content: '', paragraphs: [] });
      return copy;
    });
  }

  function removeSubpoint(ch, s) {
    setMinibook(b => {
      const copy = { ...b };
      copy.chapters[ch].subpoints.splice(s, 1);
      return copy;
    });
    setSelectedItem(null);
  }

  function addParagraph(ch, s) {
    setMinibook(b => {
      const copy = { ...b };
      const ps = copy.chapters[ch].subpoints[s].paragraphs;
      const id = `${copy.chapters[ch].subpoints[s].id}.${ps.length + 1}`;
      ps.push({ id, title: `Paragraph ${ps.length + 1}`, content: '' });
      return copy;
    });
  }

  function removeParagraph(ch, s, p) {
    setMinibook(b => {
      const copy = { ...b };
      copy.chapters[ch].subpoints[s].paragraphs.splice(p, 1);
      return copy;
    });
    setSelectedItem(null);
  }

  function getAllPaths() {
    const paths = [];
    minibook.chapters.forEach((ch, i) => {
      paths.push(`chapters.${i}`);
      ch.subpoints.forEach((sp, j) => {
        paths.push(`chapters.${i}.subpoints.${j}`);
        sp.paragraphs.forEach((p, k) => {
          paths.push(`chapters.${i}.subpoints.${j}.paragraphs.${k}`);
        });
      });
    });
    return paths;
  }

  function selectNext() {
    const paths = getAllPaths();
    if (!selectedItem) return;
    const idx = paths.indexOf(selectedItem.path);
    if (idx >= 0 && idx < paths.length - 1) {
      setSelectedItem({ item: null, path: paths[idx + 1] });
    }
  }

  function selectPrev() {
    const paths = getAllPaths();
    if (!selectedItem) return;
    const idx = paths.indexOf(selectedItem.path);
    if (idx > 0) {
      setSelectedItem({ item: null, path: paths[idx - 1] });
    }
  }

  function exportToMarkdown() {
    let md = `# ${minibook.title}\n\n`;
    if (minibook.subtitle) md += `## ${minibook.subtitle}\n\n`;

    minibook.chapters.forEach(ch => {
      md += `## ${ch.id} ${ch.title}\n\n`;
      if (ch.content) md += `${ch.content}\n\n`;
      ch.subpoints.forEach(sp => {
        md += `### ${sp.id} ${sp.title}\n\n`;
        if (sp.content) md += `${sp.content}\n\n`;
        sp.paragraphs.forEach(p => {
          md += `#### ${p.id} ${p.title}\n\n`;
          if (p.content) md += `${p.content}\n\n`;
        });
      });
    });

    const blob = new Blob([md], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${minibook.title || 'minibook'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importFromMarkdown(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => parseMarkdownContent(evt.target.result);
    reader.readAsText(file);
    e.target.value = '';
  }

  function parseMarkdownContent(content) {
    const lines = content.split(/\r?\n/);
    let title = '', subtitle = '';
    const chapters = [];
    let currentChapter = null;
    let currentSubpoint = null;
    let currentParagraph = null;
    let foundTitle = false;

    lines.forEach(line => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        title = trimmed.slice(2);
        foundTitle = true;
      } else if (trimmed.startsWith('## ')) {
        const content = trimmed.slice(3);
        const chapterMatch = content.match(/^(\d+\.\d+)\s+(.+)$/);
        if (chapterMatch) {
          currentChapter = {
            id: chapterMatch[1],
            title: chapterMatch[2],
            content: '',
            subpoints: []
          };
          chapters.push(currentChapter);
          currentSubpoint = null;
          currentParagraph = null;
        } else if (foundTitle && !subtitle) {
          subtitle = content;
        }
      } else if (trimmed.startsWith('### ')) {
        const content = trimmed.slice(4);
        const subpointMatch = content.match(/^(\d+\.\d+\.\d+)\s+(.+)$/);
        if (subpointMatch && currentChapter) {
          currentSubpoint = {
            id: subpointMatch[1],
            title: subpointMatch[2],
            content: '',
            paragraphs: []
          };
          currentChapter.subpoints.push(currentSubpoint);
          currentParagraph = null;
        }
      } else if (trimmed.startsWith('#### ')) {
        const content = trimmed.slice(5);
        const paragraphMatch = content.match(/^(\d+\.\d+\.\d+\.\d+)\s+(.+)$/);
        if (paragraphMatch && currentSubpoint) {
          currentParagraph = {
            id: paragraphMatch[1],
            title: paragraphMatch[2],
            content: ''
          };
          currentSubpoint.paragraphs.push(currentParagraph);
        }
      } else if (trimmed) {
        if (currentParagraph) {
          currentParagraph.content += (currentParagraph.content ? '\n' : '') + trimmed;
        } else if (currentSubpoint) {
          currentSubpoint.content += (currentSubpoint.content ? '\n' : '') + trimmed;
        } else if (currentChapter) {
          currentChapter.content += (currentChapter.content ? '\n' : '') + trimmed;
        }
      }
    });

    setMinibook({
      title,
      subtitle,
      structure: 'ws',
      chapters
    });
    setSelectedItem(null);
  }

  function getPathObject(p) {
    const parts = p.split('.');
    const obj = { type: 'chapter', c: +parts[1] };
    if (parts.includes('subpoints')) obj.type = 'subpoint', obj.s = +parts[3];
    if (parts.includes('paragraphs')) obj.type = 'paragraph', obj.p = +parts[5];
    return obj;
  }

  function getCurrentContent() {
    if (!selectedItem) return '';
    const p = getPathObject(selectedItem.path);
    if (p.type === 'chapter') return minibook.chapters[p.c].content;
    if (p.type === 'subpoint') return minibook.chapters[p.c].subpoints[p.s].content;
    return minibook.chapters[p.c].subpoints[p.s].paragraphs[p.p].content;
  }

  function getCurrentTitle() {
    if (!selectedItem) return '';
    const p = getPathObject(selectedItem.path);
    if (p.type === 'chapter') return minibook.chapters[p.c].title;
    if (p.type === 'subpoint') return minibook.chapters[p.c].subpoints[p.s].title;
    return minibook.chapters[p.c].subpoints[p.s].paragraphs[p.p].title;
  }

  const TreeNode = ({ item, path, level = 0 }) => {
    const [open, setOpen] = useState(true);
    const hasKids = (item.subpoints?.length || item.paragraphs?.length) > 0;
    const isSel = selectedItem?.path === path;
    const pObj = getPathObject(path);
    const match = searchTerm &&
      (item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (item.content || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div style={{ marginLeft: level * 16 }}>
        <div
          onClick={() => setSelectedItem({ item, path })}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 4,
            background: isSel ? '#ebf5ff' : match ? '#fff7d6' : undefined,
            borderLeft: isSel ? '4px solid #3b82f6' : undefined,
            cursor: 'pointer'
          }}
        >
          {hasKids && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
              style={{ marginRight: 4, background: 'none', border: 'none' }}
            >
              {open ? <ChevronDown /> : <ChevronRight />}
            </button>
          )}
          <span style={{ fontSize: 12, fontWeight: 500 }}>
            {item.id} {item.title}
          </span>
          {pObj.type === 'chapter' && (
            <button onClick={e => { e.stopPropagation(); addSubpoint(pObj.c); }} style={{ marginLeft: 4 }}>+Sub</button>
          )}
          {pObj.type === 'subpoint' && (
            <>
              <button onClick={e => { e.stopPropagation(); addParagraph(pObj.c, pObj.s); }} style={{ marginLeft: 4 }}>+Para</button>
              <button onClick={e => { e.stopPropagation(); removeSubpoint(pObj.c, pObj.s); }} style={{ marginLeft: 2 }}>✕</button>
            </>
          )}
          {pObj.type === 'paragraph' && (
            <button onClick={e => { e.stopPropagation(); removeParagraph(pObj.c, pObj.s, pObj.p); }} style={{ marginLeft: 4 }}>✕</button>
          )}
        </div>
        {open && hasKids && (
          <>
            {item.subpoints?.map((sp, i) => (
              <TreeNode key={sp.id} item={sp} path={`${path}.subpoints.${i}`} level={level + 1} />
            ))}
            {item.paragraphs?.map((p, i) => (
              <TreeNode key={p.id} item={p} path={`${path}.paragraphs.${i}`} level={level + 1} />
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Mini Book Planner</h1>
        <div className="credit">based on Chris Stanley's work</div>

        <div className="title-inputs">
          <input className="title-input" placeholder="Book Title" value={minibook.title}
            onChange={e => setMinibook(b => ({ ...b, title: e.target.value }))} />
          <input className="subtitle-input" placeholder="Subtitle (optional)" value={minibook.subtitle}
            onChange={e => setMinibook(b => ({ ...b, subtitle: e.target.value }))} />
        </div>

        <div className="outline-length">
          <label style={{ fontWeight: 600 }}>Outline Selector:</label>
          <select value={minibook.structure} onChange={e => initializeStructure(e.target.value)}>
            <option value="sm">Select model...</option>
            <option value="ws">W's Outline</option>
            <option value="sequential">Sequential</option>
            <option value="problems">10 Problems</option>
          </select>

          <label style={{ fontWeight: 600 }}>Mini Book Length:</label>
          <select value={lengthMode} onChange={e => setLengthMode(e.target.value)}>
            {Object.entries(lengthGoals).map(([key, cfg]) => (
              <option key={key} value={key}>
                {`${cfg.name}: ${cfg.pages[0]}–${cfg.pages[1]} pages/chapter`}
              </option>
            ))}
          </select>
        </div>

        <div className="controls">

        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={e => setDarkMode(e.target.checked)}
          />
          Dark
        </label>

          <label className="import-btn">
            <Upload /> Import
            <input type="file" accept=".md,.txt" onChange={importFromMarkdown} style={{ display: 'none' }} />
          </label>

          <button onClick={exportToMarkdown} disabled={!minibook.title || !minibook.chapters.length}>
            <Download /> Export
          </button>
        </div>

        <div className="stats">
          <strong>Total words:</strong> {getTotalWordCount()} / Goal: {minibook.chapters.length * getGoalWordsPerChapter()}
          <div className="progress-container">
            <div style={{
              height: '100%',
              background: getProgressColor((getTotalWordCount() / (minibook.chapters.length * getGoalWordsPerChapter())) * 100),
              width: `${Math.min(100, (getTotalWordCount() / (minibook.chapters.length * getGoalWordsPerChapter())) * 100)}%`,
              borderRadius: 4
            }}></div>
          </div>
          <div style={{ marginTop: 4 }}>
            <strong>Estimated reading:</strong> {getReadingTime()} min
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="tree-panel">
          {minibook.chapters.length ? (
            minibook.chapters.map((ch, i) => (
              <TreeNode key={ch.id} item={ch} path={`chapters.${i}`} />
            ))
          ) : (
            <p>Select a structure above</p>
          )}
        </div>

        <div className="editor-panel">
          {selectedItem ? (
            <>
              <div className="editor-header">
                <label>Title:</label>
                <input
                  className="title-edit"
                  value={getCurrentTitle()}
                  onChange={e => updateItemTitle(getPathObject(selectedItem.path), e.target.value)}
                />
              </div>
              <label>Content:</label>
              <textarea
                className="content-textarea"
                value={getCurrentContent()}
                onChange={e => updateContent(getPathObject(selectedItem.path), e.target.value)}
              />
              <p style={{ fontSize: 13, marginTop: 8 }}>
                <strong>Words:</strong> {countWords(getCurrentContent())} / Goal: {getGoalWordsPerChapter()} |
                <strong> Chars:</strong> {getCurrentContent().length}
              </p>
              <p style={{ fontSize: 13 }}>
                <strong>Reading time:</strong> {getReadingTime()} min
              </p>
              <div style={{ marginTop: 4, height: 8, background: '#eee', borderRadius: 4 }}>
                <div style={{
                  height: '100%',
                  background: getProgressColor((countWords(getCurrentContent()) / getGoalWordsPerChapter()) * 100),
                  width: `${Math.min(100, (countWords(getCurrentContent()) / getGoalWordsPerChapter()) * 100)}%`,
                  borderRadius: 4
                }}></div>
              </div>
              <div style={{ marginTop: 8 }}>
                <button onClick={selectPrev} style={{ marginRight: 4 }}>Prev</button>
                <button onClick={selectNext}>Next</button>
              </div>
            </>
          ) : (
            <p>Pick an item to edit</p>
          )}
        </div>
      </div>

      <footer className="footer" style={{ color: '#ccc', textAlign: 'center' }}>
        This app was created by Ernst van Gassen on the basis of Chris Stanley's Mini Book Straight Jacket GPT
      </footer>
    </div>
  );
}

window.App = App;
