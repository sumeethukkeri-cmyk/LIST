import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Keyboard,
  FolderPlus,
  Layers,
  Check,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { QuickAddBar } from './QuickAddBar';

const PROJECT_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#EF4444',
  '#F59E0B',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
];

export const Modals: React.FC = () => {
  const {
    quickAddModalOpen,
    setQuickAddModalOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    settingsModalOpen,
    setSettingsModalOpen,
    projectModalOpen,
    editingProjectId,
    closeProjectModal,
    workspaceModalOpen,
    setWorkspaceModalOpen,
    projects,
    addProject,
    updateProject,
    deleteProject,
    addWorkspace,
    activeFilter,
    exportDataJson,
    importDataJson,
    resetToSeedData,
    clearAllTasks,
    pushToast,
  } = useTaskStore();

  // Project modal state
  const editingProject = projects.find((p) => p.id === editingProjectId) || null;
  const [projName, setProjName] = useState('');
  const [projColor, setProjColor] = useState(PROJECT_COLORS[0]);
  const [projDesc, setProjDesc] = useState('');

  useEffect(() => {
    if (projectModalOpen) {
      if (editingProject) {
        setProjName(editingProject.name);
        setProjColor(editingProject.color);
        setProjDesc(editingProject.description || '');
      } else {
        setProjName('');
        setProjColor(PROJECT_COLORS[0]);
        setProjDesc('');
      }
    }
  }, [projectModalOpen, editingProject]);

  // Workspace modal state
  const [wsName, setWsName] = useState('');
  useEffect(() => {
    if (workspaceModalOpen) setWsName('');
  }, [workspaceModalOpen]);

  // Settings import ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    if (editingProject) {
      updateProject(editingProject.id, {
        name: projName.trim(),
        color: projColor,
        description: projDesc.trim(),
      });
      pushToast({ message: `Updated "${projName.trim()}"`, type: 'success' });
    } else {
      addProject(projName, projColor, projDesc);
    }
    closeProjectModal();
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    addWorkspace(wsName);
    setWorkspaceModalOpen(false);
  };

  const handleExport = () => {
    const json = exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-pro-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ message: 'Backup exported as JSON', type: 'success' });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const ok = importDataJson(text);
      if (!ok) {
        pushToast({
          message: 'Invalid backup JSON file format',
          type: 'warning',
        });
      } else {
        setSettingsModalOpen(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const defaultProjectId =
    activeFilter.type === 'project' ? activeFilter.projectId : null;
  const defaultDueDate =
    activeFilter.type === 'nav' && activeFilter.view === 'today'
      ? format(new Date(), 'yyyy-MM-dd')
      : null;

  return (
    <>
      {/* 1. Quick Add Task Modal */}
      {quickAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Quick Add Task"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setQuickAddModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl surface-elevated rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
                New Task
              </h2>
              <button
                type="button"
                onClick={() => setQuickAddModalOpen(false)}
                aria-label="Close new task modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <QuickAddBar
              autoFocus
              defaultProjectId={defaultProjectId}
              defaultDueDate={defaultDueDate}
              onCreated={() => setQuickAddModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 2. Project Creator / Editor Modal */}
      {projectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingProject ? 'Edit Project' : 'Create Project'}
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={closeProjectModal}
          />
          <form
            onSubmit={handleSaveProject}
            className="relative z-10 w-full max-w-md surface-elevated rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
                <h2 className="text-[16px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
                  {editingProject ? 'Edit Project' : 'New Project'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeProjectModal}
                aria-label="Close project modal"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600 dark:text-[#94A3B8]">
                Project Name
              </label>
              <input
                type="text"
                autoFocus
                required
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                placeholder="e.g. Mobile App v3"
                className="w-full px-3 py-2 rounded-xl text-[14px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600 dark:text-[#94A3B8]">
                Description (optional)
              </label>
              <input
                type="text"
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                placeholder="Brief goal or scope..."
                className="w-full px-3 py-2 rounded-xl text-[13px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-medium text-slate-600 dark:text-[#94A3B8]">
                Color
              </label>
              <div className="flex items-center gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setProjColor(c)}
                    aria-label={`Select color ${c}`}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    style={{ backgroundColor: c }}
                  >
                    {projColor === c && (
                      <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {editingProject ? (
                <button
                  type="button"
                  onClick={() => {
                    deleteProject(editingProject.id);
                    closeProjectModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#EF4444] hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  <span>Delete</span>
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeProjectModal}
                  className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl primary-gradient text-white text-[13px] font-semibold shadow-sm hover:opacity-95"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 3. Workspace Modal */}
      {workspaceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create Workspace"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setWorkspaceModalOpen(false)}
          />
          <form
            onSubmit={handleCreateWorkspace}
            className="relative z-10 w-full max-w-sm surface-elevated rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
                <h2 className="text-[16px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
                  New Workspace
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceModalOpen(false)}
                aria-label="Close workspace modal"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600 dark:text-[#94A3B8]">
                Workspace Name
              </label>
              <input
                type="text"
                autoFocus
                required
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="e.g. Consulting, Side Hustle"
                className="w-full px-3 py-2 rounded-xl text-[14px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setWorkspaceModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl primary-gradient text-white text-[13px] font-semibold shadow-sm hover:opacity-95"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Keyboard Shortcuts Modal */}
      {shortcutsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShortcutsModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md surface-elevated rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
                <h2 className="text-[16px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(false)}
                aria-label="Close shortcuts modal"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="divide-y divide-slate-200/70 dark:divide-white/[0.07] text-[13px]">
              {[
                { label: 'Command Palette & Search', keys: ['⌘', 'K'] },
                { label: 'Quick Add Task', keys: ['N'] },
                { label: 'Toggle List / Board View', keys: ['V'] },
                { label: 'Toggle Dark / Light Theme', keys: ['T'] },
                { label: 'Collapse / Expand Sidebar', keys: ['['] },
                { label: 'Close Inspector / Modal', keys: ['Esc'] },
                { label: 'Open Shortcuts Help', keys: ['?'] },
              ].map((row) => (
                <div
                  key={row.label}
                  className="py-2.5 flex items-center justify-between"
                >
                  <span className="text-slate-700 dark:text-slate-200">
                    {row.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {row.keys.map((k) => (
                      <kbd
                        key={k}
                        className="font-mono-tabular text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-200"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Settings & Data Management Modal */}
      {settingsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Data and Settings"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => {
              setConfirmClear(false);
              setSettingsModalOpen(false);
            }}
          />
          <div className="relative z-10 w-full max-w-md surface-elevated rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
                Data & Backup
              </h2>
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(false);
                  setSettingsModalOpen(false);
                }}
                aria-label="Close settings modal"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-[13px] text-slate-500 dark:text-[#94A3B8]">
              All workspaces, tasks, subtasks, and analytics are persisted locally in your browser. Export a JSON snapshot anytime for backup.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExport}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl surface-card-interactive text-[13.5px] font-medium text-slate-800 dark:text-slate-100"
              >
                <span className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
                  <span>Export Workspace JSON</span>
                </span>
                <span className="text-[11px] font-mono-tabular text-slate-400">
                  .json
                </span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl surface-card-interactive text-[13.5px] font-medium text-slate-800 dark:text-slate-100"
              >
                <span className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-[#22C55E]" strokeWidth={1.5} />
                  <span>Import Backup JSON</span>
                </span>
                <span className="text-[11px] text-slate-400">Restore</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  resetToSeedData();
                  setSettingsModalOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl surface-card-interactive text-[13.5px] font-medium text-slate-800 dark:text-slate-100"
              >
                <span className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
                  <span>Restore Sample Data</span>
                </span>
                <span className="text-[11px] text-slate-400">Reset</span>
              </button>

              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl surface-card-interactive text-[13.5px] font-medium text-[#EF4444]"
                >
                  <span className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    <span>Clear All Tasks</span>
                  </span>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium text-[#EF4444]">
                    Delete all tasks permanently?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1 rounded-lg text-[12px] text-slate-600 dark:text-slate-300 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearAllTasks();
                        setConfirmClear(false);
                        setSettingsModalOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[12px] font-semibold bg-[#EF4444] text-white"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
