import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiLock,
  FiUser,
  FiChevronDown,
} from 'react-icons/fi';
import AppShell, { Panel, StatCard, StatusPill, LoadingState, EmptyState } from '../../src/components/layout/AppShell';
import { useWorkspace } from '../../src/context/WorkspaceContext';

export default function AdminTasks() {
  const {
    currentUser, loading, workspaces,
    activeWorkspace, activeWorkspaceId, selectWorkspace,
    workspaceRole, workspaceTasks, workspaceMembers,
  } = useWorkspace();
  const [filterStatus, setFilterStatus] = useState('all');
  const [showWsPicker, setShowWsPicker] = useState(false);

  const user = useMemo(() => {
    if (!currentUser) return null;
    return {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
      role: workspaceRole || currentUser.role,
      departmentId: currentUser.departmentId,
      createdAt: currentUser.createdAt,
    };
  }, [currentUser, workspaceRole]);

  const myWorkspaces = useMemo(() => {
    if (!currentUser) return [];
    return workspaces.filter((ws) =>
      ws.members?.some((m) => m.userId === currentUser.id)
    );
  }, [workspaces, currentUser]);

  const isOwner = workspaceRole === 'OWNER';

  // Scope tasks to active workspace
  const scopedTasks = useMemo(
    () => (workspaceTasks || []).filter(
      (t) => t.workspaceId === activeWorkspace?.id || t.departmentId === activeWorkspace?.id
    ),
    [workspaceTasks, activeWorkspace]
  );

  // Build assignee name map from workspaceMembers
  const memberMap = useMemo(() => {
    const map = {};
    workspaceMembers.forEach((m) => {
      map[m.userId] = m.name || m.nickname || 'Unknown';
    });
    return map;
  }, [workspaceMembers]);

  const enhanced = useMemo(() => {
    let list = scopedTasks.map((t) => ({
      ...t,
      assigneeName: memberMap[t.assigneeId] || 'Unassigned',
    }));
    if (filterStatus !== 'all') list = list.filter((t) => t.status === filterStatus);
    return list;
  }, [scopedTasks, filterStatus, memberMap]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <FiLoader className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <FiLock className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-500">Please log in first.</p>
          <Link href="/login" className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white">Go to Login</Link>
        </div>
      </div>
    );
  }

  // Workspace picker
  if (!activeWorkspace) {
    return (
      <AppShell user={user} showWorkspaceSwitcher={false}>
        <div className="mx-auto mt-20 max-w-lg px-4 text-center">
          <FiBriefcase className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Select a workspace</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose a workspace to view its tasks.</p>
          <div className="mt-6 space-y-2">
            {myWorkspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => selectWorkspace(ws.id)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-left font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                {ws.name}
              </button>
            ))}
            {myWorkspaces.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-500">
                No workspaces yet. <Link href="/workspace" className="text-primary-600">Create one</Link>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!isOwner) {
    return (
      <AppShell user={user} showWorkspaceSwitcher={false}>
        <div className="mx-auto mt-20 max-w-lg px-4 text-center">
          <FiLock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Owner access required</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You need the Owner role in <strong>{activeWorkspace.name}</strong> to view all tasks.
          </p>
          <Link href="/workspace" className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white">Go to Workspace</Link>
        </div>
      </AppShell>
    );
  }

  const total = scopedTasks.length;
  const completed = scopedTasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgress = scopedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdue = scopedTasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED'
  ).length;

  return (
    <AppShell
      user={user}
      eyebrow={activeWorkspace?.name || 'Admin'}
      title="All tasks"
      description={`${total} tasks · ${completed} completed · ${inProgress} in progress · ${overdue} overdue`}
    >
      {/* Workspace selector */}
      <div className="relative mb-4">
        <button
          type="button"
          onClick={() => setShowWsPicker(!showWsPicker)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <FiBriefcase className="h-4 w-4" />
          {activeWorkspace.name}
          <FiChevronDown className="h-4 w-4" />
        </button>
        {showWsPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowWsPicker(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-lg">
              {myWorkspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => { selectWorkspace(ws.id); setShowWsPicker(false); }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                    ws.id === activeWorkspaceId
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {ws.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total tasks" value={total} detail="Across workspace" icon={FiBriefcase} tone="blue" />
        <StatCard label="Completed" value={completed} detail={`${total ? Math.round((completed / total) * 100) : 0}% completion`} icon={FiCheckCircle} tone="green" />
        <StatCard label="In progress" value={inProgress} detail="Actively worked on" icon={FiBarChart2} tone="amber" />
        <StatCard label="Overdue" value={overdue} detail="Needs attention" icon={FiAlertTriangle} tone={overdue ? 'red' : 'slate'} />
      </div>

      <Panel title={`Tasks (${enhanced.length})`} description="Filter by status to inspect" className="mt-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All', count: total },
            { key: 'PENDING', label: 'Pending', count: scopedTasks.filter((t) => t.status === 'PENDING').length },
            { key: 'IN_PROGRESS', label: 'In Progress', count: inProgress },
            { key: 'COMPLETED', label: 'Completed', count: completed },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterStatus(f.key)}
              className={`h-9 rounded-lg px-3 text-sm font-bold transition ${
                filterStatus === f.key
                  ? 'bg-[#172033] text-white dark:bg-slate-100 dark:text-slate-950'
                  : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {enhanced.length === 0 ? (
          <EmptyState icon={FiCheckCircle} title="No tasks match" description="Try adjusting the filter." />
        ) : (
          <div className="space-y-2">
            {enhanced.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="flex items-center gap-4 rounded-lg border border-slate-200/80 bg-[#fbfcfe] px-4 py-3 text-sm transition hover:border-primary-200 dark:border-slate-800 dark:bg-[#17212c]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</span>
                    <StatusPill tone={statusTone(task.status)}>{task.status.replace('_', ' ')}</StatusPill>
                    <StatusPill tone={priorityTone(task.priority)}>{task.priority}</StatusPill>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FiUser className="h-3 w-3" />
                      {task.assigneeName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiCalendar className="h-3 w-3" />
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                    </span>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-primary-600'}`}
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{task.progress || 0}%</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

function statusTone(s) {
  if (s === 'COMPLETED') return 'green';
  if (s === 'IN_PROGRESS') return 'blue';
  if (s === 'PENDING') return 'amber';
  if (s === 'OVERDUE') return 'red';
  return 'slate';
}
function priorityTone(p) {
  if (p === 'URGENT' || p === 'HIGH') return 'red';
  if (p === 'MEDIUM') return 'amber';
  return 'green';
}
