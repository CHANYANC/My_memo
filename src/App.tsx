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
  ArrowRight,
  Info,
  Settings2,
  Flag,
  Star,
  Bookmark,
  MapPin,
  User,
  Zap,
  Heart,
  Smile,
  Compass,
  Briefcase,
  Palette,
  Type
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DOMPurify from 'dompurify';
import RichTextEditor from './components/RichTextEditor';

// --- Types ---

type Note = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  color?: string;
  updatedAt: string;
};

type TagSetting = {
  color: string;
  icon: string;
};

// --- Constants & Seed Data ---

const LOCAL_STORAGE_KEY = "mymemo.notes";
const TAG_SETTINGS_KEY = "mymemo.tagsettings";

const AVAILABLE_ICONS = [
  { name: "Tag", icon: Tag },
  { name: "Hash", icon: Hash },
  { name: "Flag", icon: Flag },
  { name: "Star", icon: Star },
  { name: "Bookmark", icon: Bookmark },
  { name: "MapPin", icon: MapPin },
  { name: "User", icon: User },
  { name: "Zap", icon: Zap },
  { name: "Heart", icon: Heart },
  { name: "Smile", icon: Smile },
  { name: "Compass", icon: Compass },
  { name: "Briefcase", icon: Briefcase },
];

const AVAILABLE_COLORS = [
  { name: "Slate", bg: "bg-slate-500", text: "text-slate-50" },
  { name: "Red", bg: "bg-red-500", text: "text-red-50" },
  { name: "Orange", bg: "bg-orange-500", text: "text-orange-50" },
  { name: "Amber", bg: "bg-amber-500", text: "text-amber-50" },
  { name: "Lime", bg: "bg-lime-500", text: "text-lime-50" },
  { name: "Emerald", bg: "bg-emerald-500", text: "text-emerald-50" },
  { name: "Cyan", bg: "bg-cyan-500", text: "text-cyan-50" },
  { name: "Blue", bg: "bg-blue-500", text: "text-blue-50" },
  { name: "Indigo", bg: "bg-indigo-500", text: "text-indigo-50" },
  { name: "Violet", bg: "bg-violet-500", text: "text-violet-50" },
  { name: "Rose", bg: "bg-rose-500", text: "text-rose-50" },
];

const NOTE_COLORS = [
  { name: "Default", bg: "bg-[#151517]", border: "border-slate-800" },
  { name: "Red", bg: "bg-red-900/20", border: "border-red-500/30", accent: "text-red-400" },
  { name: "Amber", bg: "bg-amber-900/20", border: "border-amber-500/30", accent: "text-amber-400" },
  { name: "Emerald", bg: "bg-emerald-900/20", border: "border-emerald-500/30", accent: "text-emerald-400" },
  { name: "Blue", bg: "bg-blue-900/20", border: "border-blue-500/30", accent: "text-blue-400" },
  { name: "Indigo", bg: "bg-indigo-900/20", border: "border-indigo-500/30", accent: "text-indigo-400" },
  { name: "Violet", bg: "bg-violet-900/20", border: "border-violet-500/30", accent: "text-violet-400" },
  { name: "Rose", bg: "bg-rose-900/20", border: "border-rose-500/30", accent: "text-rose-400" },
];

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
  const [tagSettings, setTagSettings] = useState<Record<string, TagSetting>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"AND" | "OR" | "SINGLE">("SINGLE");
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTagToEdit, setSelectedTagToEdit] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // New: Custom Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id?: number; isBulk?: boolean }>({
    isOpen: false
  });

  // Autocomplete State
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [noteColor, setNoteColor] = useState("Default");

  // Load Initial Data
  useEffect(() => {
    const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
    const savedTagSettings = localStorage.getItem(TAG_SETTINGS_KEY);

    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to parse notes", e);
        setNotes(SEED_NOTES);
      }
    } else {
      setNotes(SEED_NOTES);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_NOTES));
    }

    if (savedTagSettings) {
      try {
        setTagSettings(JSON.parse(savedTagSettings));
      } catch (e) {
        console.error("Failed to parse tag settings", e);
      }
    }

    setIsInitialized(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(TAG_SETTINGS_KEY, JSON.stringify(tagSettings));
    }
  }, [tagSettings, isInitialized]);

  // Derived State: Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesSearch = 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        
        let matchesTags = true;
        if (selectedTags.length > 0) {
          if (filterMode === "AND") {
            matchesTags = selectedTags.every(tag => note.tags.includes(tag));
          } else if (filterMode === "OR") {
            matchesTags = selectedTags.some(tag => note.tags.includes(tag));
          } else {
            // SINGLE mode: essentially the same as OR but meant to be used with one tag
            matchesTags = selectedTags.some(tag => note.tags.includes(tag));
          }
        }
        
        return matchesSearch && matchesTags;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, searchQuery, selectedTags, filterMode]);

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

  // Cleanup selected tags if they no longer exist
  useEffect(() => {
    if (isInitialized && selectedTags.length > 0) {
      const remainingTags = new Set(notes.flatMap(n => n.tags));
      setSelectedTags(prev => prev.filter(tag => remainingTags.has(tag)));
    }
  }, [notes, isInitialized]);

  // Handlers
  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setBody(note.body);
      setTagsInput(note.tags.join(", "));
      setNoteColor(note.color || "Default");
    } else {
      setEditingNote(null);
      setTitle("");
      setBody("");
      setTagsInput("");
      setNoteColor("Default");
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
      setNotes(prev => {
        const newNotes = prev.map(n => 
          n.id === editingNote.id 
            ? { ...n, title, body, tags, color: noteColor, updatedAt: new Date().toISOString() } 
            : n
        );
        return newNotes;
      });
    } else {
      const newNote: Note = {
        id: Date.now(),
        title,
        body,
        tags,
        color: noteColor,
        updatedAt: new Date().toISOString(),
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteNote = (id: number) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleDeleteSelected = () => {
    if (selectedNoteIds.length === 0) return;
    setDeleteConfirm({ isOpen: true, isBulk: true });
  };

  const confirmDelete = () => {
    if (deleteConfirm.isBulk) {
      setNotes(prev => prev.filter(n => !selectedNoteIds.includes(n.id)));
      setSelectedNoteIds([]);
    } else if (deleteConfirm.id !== undefined) {
      const id = deleteConfirm.id;
      setNotes(prev => prev.filter(n => n.id !== id));
      setSelectedNoteIds(prev => prev.filter(selectedId => selectedId !== id));
    }
    setDeleteConfirm({ isOpen: false });
  };

  const toggleNoteSelection = (id: number) => {
    setSelectedNoteIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredNotes.map(n => n.id);
    setSelectedNoteIds(prev => {
      const combined = new Set([...prev, ...filteredIds]);
      return Array.from(combined);
    });
  };

  const handleDeselectAll = () => {
    setSelectedNoteIds([]);
  };

  const toggleTagSelection = (tag: string) => {
    if (filterMode === "SINGLE") {
      setSelectedTags(prev => prev.includes(tag) ? [] : [tag]);
    } else {
      setSelectedTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
    }
  };

  const handleUpdateTagSetting = (tagName: string, setting: Partial<TagSetting>) => {
    setTagSettings(prev => ({
      ...prev,
      [tagName]: {
        color: prev[tagName]?.color || "Slate",
        icon: prev[tagName]?.icon || "Tag",
        ...setting
      }
    }));
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

          <div className="flex items-center gap-3">
            <div className="flex bg-[#1A1A1C] border border-slate-700 p-0.5 rounded-sm mr-2">
              <button 
                onClick={handleSelectAllFiltered}
                className="text-[10px] px-3 py-1.5 rounded-[1px] text-slate-400 hover:text-slate-200 transition-colors uppercase font-bold"
                title="현재 필터링된 모든 메모 선택"
              >
                Select All
              </button>
              <div className="w-px bg-slate-700 mx-0.5" />
              <button 
                onClick={handleDeselectAll}
                className="text-[10px] px-3 py-1.5 rounded-[1px] text-slate-400 hover:text-slate-200 transition-colors uppercase font-bold"
                title="모든 선택 해제"
              >
                Clear
              </button>
            </div>

            <AnimatePresence>
              {selectedNoteIds.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={handleDeleteSelected}
                  className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-sm font-semibold text-sm flex items-center gap-2 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{selectedNoteIds.length}개 삭제</span>
                </motion.button>
              )}
            </AnimatePresence>

            <button 
              onClick={() => handleOpenModal()}
              className="bg-slate-200 text-slate-900 px-5 py-2.5 rounded-sm font-semibold text-sm flex items-center gap-2 hover:bg-white active:scale-95 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              새 메모
            </button>
          </div>
        </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-[#0F0F10] p-6 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">필터</div>
            <div className="flex bg-[#1A1A1C] border border-slate-700 p-0.5 rounded-sm">
              <button 
                onClick={() => setFilterMode("SINGLE")}
                className={`text-[9px] px-2 py-1 rounded-[1px] transition-all ${filterMode === "SINGLE" ? "bg-slate-200 text-slate-900 font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                ONE
              </button>
              <button 
                onClick={() => setFilterMode("OR")}
                className={`text-[9px] px-2 py-1 rounded-[1px] transition-all ${filterMode === "OR" ? "bg-slate-200 text-slate-900 font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                OR
              </button>
              <button 
                onClick={() => setFilterMode("AND")}
                className={`text-[9px] px-2 py-1 rounded-[1px] transition-all ${filterMode === "AND" ? "bg-slate-200 text-slate-900 font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                AND
              </button>
            </div>
          </div>
          <nav className="space-y-1">
            <button 
              onClick={() => setSelectedTags([])}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm transition-all text-sm font-medium border-l-4 ${selectedTags.length === 0 ? 'bg-slate-800/50 text-white border-slate-200' : 'text-slate-400 border-transparent hover:bg-slate-800/30'}`}
            >
              <span>전체 메모</span>
              <span className={`text-xs px-2 py-0.5 rounded transition-colors ${selectedTags.length === 0 ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-500'}`}>
                {notes.length}
              </span>
            </button>

            {allTags.map(([tag, count]) => {
              const setting = tagSettings[tag] || { color: "Slate", icon: "Tag" };
              const colorInfo = AVAILABLE_COLORS.find(c => c.name === setting.color) || AVAILABLE_COLORS[0];
              const IconComp = AVAILABLE_ICONS.find(i => i.name === setting.icon)?.icon || Tag;

              return (
                <div key={tag} className="group/tag flex items-center gap-1">
                  <button 
                    onClick={() => toggleTagSelection(tag)}
                    className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-sm transition-all text-sm border-l-4 ${selectedTags.includes(tag) ? 'bg-slate-800/50 text-white border-slate-200' : 'text-slate-400 border-transparent hover:bg-slate-800/30'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm shrink-0 transition-all ${selectedTags.includes(tag) ? `bg-slate-200 text-black` : `${colorInfo.bg} ${colorInfo.text}`}`}>
                        <IconComp size={10} strokeWidth={3} />
                      </div>
                      <span className="truncate">{tag}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded transition-colors ${selectedTags.includes(tag) ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTagToEdit(tag);
                      setIsTagModalOpen(true);
                    }}
                    className="p-2 text-slate-600 hover:text-slate-300 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                    title="태그 설정"
                  >
                    <Settings2 size={14} />
                  </button>
                </div>
              );
            })}
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
        <main className="flex-1 p-8 overflow-y-auto bg-[#0A0A0B]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => {
                const colorTheme = NOTE_COLORS.find(c => c.name === note.color) || NOTE_COLORS[0];
                return (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`${colorTheme.bg} border ${colorTheme.border} p-6 rounded-sm flex flex-col relative group transition-all shadow-xl h-64 overflow-hidden ${selectedNoteIds.includes(note.id) ? 'border-slate-400 ring-1 ring-slate-400 font-bold' : 'hover:border-slate-600'}`}
                  >
                    {/* Top Layer: Interaction Buttons */}
                    <div className="flex justify-between items-start mb-4 gap-3 relative z-30">
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNoteSelection(note.id);
                          }}
                          className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-all shrink-0 cursor-pointer ${selectedNoteIds.includes(note.id) ? 'bg-slate-100 border-slate-100 text-black shadow-lg shadow-white/10' : 'bg-black/40 border-slate-700 text-transparent hover:border-slate-500'}`}
                        >
                          <Check className="w-4 h-4" strokeWidth={4} />
                        </button>
                        <h3 className={`font-bold text-lg leading-tight truncate ${colorTheme.accent || 'text-slate-100'}`}>{note.title || "제목 없음"}</h3>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeleteNote(note.id);
                        }}
                        className="p-2 -mr-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-sm shrink-0 cursor-pointer"
                        title="메모 삭제"
                      >
                        <Trash2 className="w-5 h-5 transition-transform hover:scale-110 active:scale-95" />
                      </button>
                    </div>

                    {/* Body Layer: Clickable Content */}
                    <div 
                      className="flex-1 flex flex-col cursor-pointer relative z-10 overflow-hidden"
                      onClick={() => handleOpenModal(note)}
                    >
                      <div 
                        className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-5 whitespace-pre-wrap flex-1 prose-style-compact"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.body) }}
                      />
                      
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {note.tags.map(tag => {
                          const setting = tagSettings[tag] || { color: "Slate", icon: "Tag" };
                          const colorInfo = AVAILABLE_COLORS.find(c => c.name === setting.color) || AVAILABLE_COLORS[0];
                          const IconComp = AVAILABLE_ICONS.find(i => i.name === setting.icon)?.icon || Tag;

                          return (
                            <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-[1px] font-mono tracking-tight uppercase border flex items-center gap-1.5 ${colorInfo.bg} ${colorInfo.text} border-white/10`}>
                              <IconComp size={9} strokeWidth={3} />
                              {tag}
                            </span>
                          );
                        })}
                        {note.tags.length === 0 && (
                          <span className="text-[10px] text-slate-700 font-mono italic">no tags</span>
                        )}
                      </div>
                    </div>

                    {/* Decorative Info */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </motion.div>
                );
              })}

              {/* New Note Ghost Card */}
              <motion.div 
                layout
                onClick={() => handleOpenModal()}
                className="border border-dashed border-slate-800 p-6 rounded-sm flex flex-col items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-600 transition-all cursor-pointer group h-64 bg-slate-900/10"
              >
                <Plus className="w-8 h-8 mb-2 transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold uppercase tracking-widest">Add New Note</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Tag Settings Modal */}
      <AnimatePresence>
        {isTagModalOpen && selectedTagToEdit && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTagModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#121214] border border-slate-700 shadow-2xl rounded-sm p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold tracking-tight uppercase">태그 설정</h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">EDITING: #{selectedTagToEdit}</p>
                </div>
                <button 
                  onClick={() => setIsTagModalOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-4">아이콘 선택</label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_ICONS.map(({ name, icon: IconComp }) => (
                      <button
                        key={name}
                        onClick={() => handleUpdateTagSetting(selectedTagToEdit, { icon: name })}
                        className={`aspect-square flex items-center justify-center rounded-sm transition-all ${tagSettings[selectedTagToEdit]?.icon === name ? 'bg-slate-200 text-black shadow-lg scale-110' : 'bg-[#1A1A1C] border border-slate-800 text-slate-500 hover:border-slate-500'}`}
                      >
                        <IconComp size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-4">색상 선택</label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_COLORS.map(({ name, bg }) => (
                      <button
                        key={name}
                        onClick={() => handleUpdateTagSetting(selectedTagToEdit, { color: name })}
                        className={`aspect-square rounded-full transition-all border-2 ${bg} ${tagSettings[selectedTagToEdit]?.color === name ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        title={name}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setIsTagModalOpen(false)}
                    className="w-full bg-slate-200 text-slate-900 py-3 rounded-sm text-sm font-bold hover:bg-white transition-all uppercase tracking-widest"
                  >
                    확인
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note Modal */}
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
              className={`relative w-full max-w-2xl ${NOTE_COLORS.find(c => c.name === noteColor)?.bg || 'bg-[#121214]'} border ${NOTE_COLORS.find(c => c.name === noteColor)?.border || 'border-slate-700'} shadow-2xl rounded-sm p-8 max-h-[90vh] overflow-y-auto z-50`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">제목</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요" 
                        className="w-full bg-black/40 border border-slate-800 focus:border-slate-500 outline-none p-3 text-sm text-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">본문</label>
                      <RichTextEditor 
                        content={body} 
                        onChange={(content) => setBody(content)} 
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">메모 색상 테마</label>
                      <div className="grid grid-cols-4 gap-2">
                        {NOTE_COLORS.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => setNoteColor(color.name)}
                            className={`h-10 rounded-sm border-2 transition-all ${color.bg} ${color.border} ${noteColor === color.name ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            title={color.name}
                          />
                        ))}
                      </div>
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
                          className="w-full bg-black/40 border border-slate-800 focus:border-slate-500 outline-none p-3 text-sm text-white font-mono transition-colors"
                        />
                        
                        <AnimatePresence>
                          {showSuggestions && tagSuggestions.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute left-0 right-0 bottom-full mb-1 bg-[#1A1A1C] border border-slate-800 shadow-2xl z-[100] rounded-sm overflow-hidden"
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
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-white/5">
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
                    메모 저장
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ isOpen: false })}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#121214] border border-slate-800 p-8 rounded-sm shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">메모 삭제 확인</h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                {deleteConfirm.isBulk 
                  ? `${selectedNoteIds.length}개의 선택된 메모를 삭제하시겠습니까?` 
                  : "선택한 메모를 정말 삭제하시겠습니까? 삭제된 메모는 복구할 수 없습니다."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setDeleteConfirm({ isOpen: false })}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors uppercase text-[10px] font-bold tracking-widest rounded-sm"
                >
                  취소
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white transition-colors uppercase text-[10px] font-bold tracking-widest rounded-sm"
                >
                  삭제
                </button>
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
