/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import type { KeyboardEvent } from "react";
import { 
  Plus, 
  Search, 
  Tag, 
  Trash2, 
  FileText, 
  X, 
  Check,
  Hash,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---

type Note = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
};

// --- Constants & Seed Data ---

const LOCAL_STORAGE_KEY = "mymemo.notes";

const SEED_NOTES: Note[] = [
  {
    id: 1,
    title: "시안 작업 가이드",
    body: "웹 인터페이스의 핵심 원칙과 레이아웃 시스템을 정리합니다. 그리드 정렬 및 기하학적 밸런스를 중점적으로 검토해야 합니다.",
    tags: ["디자인", "가이드"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "읽어야 할 책 리스트",
    body: "1. 바우하우스의 디자인 원칙\n2. 미니멀리즘과 실용주의\n3. 프론트엔드 개발의 정석",
    tags: ["독서", "자기개발"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: "프로젝트 아이디어",
    body: "Next.js를 활용한 개인용 생산성 대시보드. 위젯 기반의 레이아웃과 커스텀 테마 기능을 포함할 것.",
    tags: ["업무", "개발"],
    updatedAt: new Date().toISOString(),
  },
];

// --- Components ---

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Autocomplete State
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Load Initial Data
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notes", e);
        setNotes(SEED_NOTES);
      }
    } else {
      setNotes(SEED_NOTES);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_NOTES));
    }
    setIsInitialized(true);
  }, []);

  // Save to LocalStorage (Fixed: now saves even if length is 0)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isInitialized]);

  // Derived State: Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesSearch = 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true;
        
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, searchQuery, selectedTag]);

  // Derived State: Tags List with Count
  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Derived State: Tag Suggestions
  const currentTagInput = useMemo(() => {
    const parts = tagsInput.split(",");
    return parts[parts.length - 1].trim();
  }, [tagsInput]);

  const tagSuggestions = useMemo(() => {
    if (!currentTagInput || !showSuggestions) return [];
    return allTags
      .map(([tag]) => tag)
      .filter(tag => 
        tag.toLowerCase().includes(currentTagInput.toLowerCase()) && 
        !tagsInput.toLowerCase().split(",").map(t => t.trim()).slice(0, -1).includes(tag.toLowerCase())
      )
      .slice(0, 5);
  }, [currentTagInput, allTags, tagsInput, showSuggestions]);

  // Reset suggestion index when suggestions change
  useEffect(() => {
    setSuggestionIndex(0);
  }, [tagSuggestions]);

  // Cleanup selected tag if it no longer exists
  useEffect(() => {
    if (isInitialized && selectedTag) {
      const remainingTags = new Set(notes.flatMap(n => n.tags));
      if (!remainingTags.has(selectedTag)) {
        setSelectedTag(null);
      }
    }
  }, [notes, isInitialized, selectedTag]);

  // Handlers
  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setBody(note.body);
      setTagsInput(note.tags.join(", "));
    } else {
      setEditingNote(null);
      setTitle("");
      setBody("");
      setTagsInput("");
    }
    setIsModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!title.trim() && !body.trim()) return;

    const tags = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "");

    if (editingNote) {
      const updatedNotes = notes.map(n => 
        n.id === editingNote.id 
          ? { ...n, title, body, tags, updatedAt: new Date().toISOString() } 
          : n
      );
      setNotes(updatedNotes);
    } else {
      const newNote: Note = {
        id: Date.now(),
        title,
        body,
        tags,
        updatedAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteNote = (id: number) => {
    if (window.confirm("메모를 정말 삭제하시겠습니까?")) {
      const updatedNotes = notes.filter(n => n.id !== id);
      setNotes(updatedNotes);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    const parts = tagsInput.split(",");
    parts[parts.length - 1] = " " + suggestion;
    setTagsInput(parts.join(",") + ", ");
    setShowSuggestions(false);
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (tagSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % tagSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + tagSuggestions.length) % tagSuggestions.length);
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        handleSelectSuggestion(tagSuggestions[suggestionIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    }
  };

  const storageSize = useMemo(() => {
    const str = JSON.stringify(notes);
    return (new Blob([str]).size / 1024).toFixed(1);
  }, [notes]);

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] text-slate-100 font-sans overflow-hidden border border-slate-800">
      {/* Header */}
      <header className="h-20 shrink-0 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0F0F10]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-200 flex items-center justify-center rounded-sm">
            <FileText className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold tracking-tight uppercase">MyMemo</h1>
        </div>
        
        <div className="flex-1 max-w-md mx-12 relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="메모 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1C] border border-slate-700 rounded-sm py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-slate-400 placeholder:text-slate-600 transition-colors"
          />
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="bg-slate-200 text-slate-900 px-5 py-2.5 rounded-sm font-semibold text-sm flex items-center gap-2 hover:bg-white active:scale-95 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          새 메모
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-[#0F0F10] p-6 flex flex-col shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">필터</div>
          <nav className="space-y-1">
            <button 
              onClick={() => setSelectedTag(null)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm transition-all text-sm font-medium border-l-4 ${!selectedTag ? 'bg-slate-800/50 text-white border-slate-200' : 'text-slate-400 border-transparent hover:bg-slate-800/30'}`}
            >
              <span>전체 메모</span>
              <span className={`text-xs px-2 py-0.5 rounded transition-colors ${!selectedTag ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-500'}`}>
                {notes.length}
              </span>
            </button>

            {allTags.map(([tag, count]) => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm transition-all text-sm border-l-4 ${tag === selectedTag ? 'bg-slate-800/50 text-white border-slate-200' : 'text-slate-400 border-transparent hover:bg-slate-800/30'}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Hash className="w-3.5 h-3.5 shrink-0 opacity-40" />
                  <span className="truncate">{tag}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded transition-colors ${tag === selectedTag ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            ))}
          </nav>
          
          <div className="mt-auto">
            <div className="p-4 border border-slate-800 rounded-sm bg-[#1A1A1C] flex gap-3">
              <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 uppercase leading-relaxed font-medium">
                모든 데이터는 브라우저의 Local Storage에 안전하게 저장됩니다.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max overflow-y-auto bg-[#0A0A0B]">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#151517] border border-slate-800 p-6 rounded-sm flex flex-col relative group hover:border-slate-500 transition-all cursor-pointer shadow-xl h-64"
                onClick={() => handleOpenModal(note)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg leading-tight pr-8 line-clamp-1">{note.title || "제목 없음"}</h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-500/10 rounded-sm"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1 line-clamp-3 whitespace-pre-wrap">
                  {note.body}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {note.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-sm font-mono tracking-tight uppercase">
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length === 0 && (
                    <span className="text-[10px] text-slate-600 font-mono italic">no tags</span>
                  )}
                </div>
              </motion.div>
            ))}

            {/* New Note Ghost Card */}
            <motion.div 
              layout
              onClick={() => handleOpenModal()}
              className="border border-dashed border-slate-800 p-6 rounded-sm flex flex-col items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-600 transition-all cursor-pointer group h-64 bg-slate-900/10"
            >
              <Plus className="w-8 h-8 mb-2 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium uppercase tracking-tight">새로운 메모 작성</span>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#121214] border border-slate-700 shadow-2xl rounded-sm p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold tracking-tight uppercase">
                  {editingNote ? "메모 수정" : "새 메모 작성"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">제목</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요" 
                    className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-slate-500 outline-none p-3 text-sm text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">본문</label>
                  <textarea 
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="메모 내용을 입력하세요..." 
                    className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-slate-500 outline-none p-3 text-sm text-white resize-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2 font-mono">태그</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={tagsInput}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onChange={(e) => {
                        setTagsInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onKeyDown={handleTagKeyDown}
                      placeholder="쉼표로 구분 (예: 디자인, 업무)" 
                      className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-slate-500 outline-none p-3 text-sm text-white font-mono transition-colors"
                    />
                    
                    <AnimatePresence>
                      {showSuggestions && tagSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 right-0 top-full mt-1 bg-[#1A1A1C] border border-slate-800 shadow-2xl z-50 rounded-sm overflow-hidden"
                        >
                          {tagSuggestions.map((suggestion, index) => (
                            <button
                              key={suggestion}
                              onClick={() => handleSelectSuggestion(suggestion)}
                              className={`w-full text-left px-4 py-2.5 text-xs font-mono uppercase tracking-tighter flex items-center justify-between transition-colors ${index === suggestionIndex ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}
                            >
                              <span>#{suggestion}</span>
                              {index === suggestionIndex && <span className="text-[10px] opacity-60">TAB to Select</span>}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-sm text-sm font-semibold hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleSaveNote}
                    className="flex-1 bg-slate-200 text-slate-900 py-3 rounded-sm text-sm font-bold hover:bg-white active:scale-95 transition-all"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Status Bar */}
      <footer className="h-8 bg-[#0F0F10] border-t border-slate-800 px-6 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600 uppercase">
          <span className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            SYSTEM {isInitialized ? 'READY' : 'LOADING'}
          </span>
          <span>STORAGE: {storageSize}KB</span>
        </div>
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter">
          © 2024 MYMEMO APP v1.0.2 • GEOMETRIC BALANCE THEME
        </div>
      </footer>
    </div>
  );
}
