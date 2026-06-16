import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiLoader, FiTarget, FiBriefcase, FiLock, FiChevronDown } from 'react-icons/fi';
import AppShell, { Panel, StatCard, StatusPill } from '../../src/components/layout/AppShell';
import { useWorkspace } from '../../src/context/WorkspaceContext';
import TaskList from '../../src/components/tasks/TaskList';

export default function EmployeeDashboard() {
  const {
    currentUser, loading, workspaces,
    activeWorkspace, activeWorkspaceId, selectWorkspace,
    workspaceRole, workspaceTasks,
  } = useWorkspace();
  const [activeFilter, setActiveFilter] = useState('all');
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

  // Only show workspaces the user is a member of
  const myWorkspaces = useMemo(() => {
    if (!currentUser) return [];
    return workspaces.filter((ws) =>
      ws.members?.some((m) => m.userId === currentUser.id)
    );
  }, [workspaces, currentUser]);

  // Scope tasks to active workspace
  const scopedTasks = useMemo(
    () => (workspaceTasks || []).filter((t) => t.workspaceId === activeWorkspace?.id || t.departmentId === activeWorkspace?.id),
    [workspaceTasks, activeWorkspace]
  );

  const dashboard = useMemo(() => {
    if (!currentUser) return null;

    const myTasks = scopedTasks.filter((task) => task.assigneeId === currentUser.id);
    const pending = myTasks.filter((t) => t.status === 'PENDING').length;
    const inProgress = myTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = myTasks.filter((t) => t.status === 'COMPLETED').length;
    const overdue = myTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED').length;
    const avgProgress = myTasks.length
      ? Math.round(myTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / myTasks.length)
      : 0;
    const nextTask = [...myTasks]
      .filter((t) => t.status !== 'COMPLETED')
      .sort((a, b) => new Date(a.deadline || '2999-01-01') - new Date(b.deadline || '2999-01-01'))[0];

    return { myTasks, pending, inProgress, completed, overdue, avgProgress, nextTask };
  }, [workspaceTasks, currentUser]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <FiLoader className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading employee workspace...</p>
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
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose a workspace to view your tasks.</p>
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

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-950">
        <FiLoader className="mx-auto h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const filters = [
    { key: 'all', label: 'All', count: dashboard.myTasks.length },
    { key: 'PENDING', label: 'Pending', count: dashboard.pending },
    { key: 'IN_PROGRESS', label: 'In progress', count: dashboard.inProgress },
    { key: 'COMPLETED', label: 'Completed', count: dashboard.completed },
  ];

  return (
    <AppShell
      user={user}
      eyebrow={activeWorkspace?.name || 'Employee workspace'}
      title="My task board"
      description="Focus on what is assigned to you, what is due soon, and what is already complete."
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
        <StatCard label="My tasks" value={dashboard.myTasks.length} detail={`${dashboard.avgProgress}% average progress`} icon={FiTarget} tone="blue" />
        <StatCard label="Pending" value={dashboard.pending} detail="Waiting to start" icon={FiClock} tone="amber" />
        <StatCard label="In progress" value={dashboard.inProgress} detail="Currently active" icon={FiLoader} tone="blue" />
        <StatCard label="Completed" value={dashboard.completed} detail="Closed successfully" icon={FiCheckCircle} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <Panel title="Next focus" description="The most urgent open task.">
          {dashboard.nextTask ? (
            <div className="rounded-lg bg-[#172033] dark:bg-slate-800 p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <StatusPill tone={dashboard.overdue ? 'red' : 'amber'}>{dashboard.nextTask.priority}</StatusPill>
                  <h2 className="mt-4 text-lg font-bold">{dashboard.nextTask.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{dashboard.nextTask.description}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
                <span>{dashboard.nextTask.deadline ? new Date(dashboard.nextTask.deadline).toLocaleDateString() : 'No deadline'}</span>
                <span>{dashboard.nextTask.progress || 0}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${dashboard.nextTask.progress || 0}%` }} />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-[#f4f7fb] dark:bg-slate-800 p-6 text-center">
              <FiCheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">No open tasks. Nice and tidy.</p>
            </div>
          )}

          {dashboard.overdue > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300">
              <FiAlertTriangle className="h-4 w-4" />
              {dashboard.overdue} overdue task needs attention
            </div>
          )}
        </Panel>

        <Panel title="Task list" description="Filter by status and scan progress quickly.">
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveFilter(item.key)}
                className={`h-9 rounded-lg px-3 text-sm font-bold transition ${
                  activeFilter === item.key
                    ? 'bg-[#172033] dark:bg-slate-100 text-white dark:text-slate-950'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>
          <TaskList filters={{ assigneeId: currentUser.id, status: activeFilter === 'all' ? undefined : activeFilter }} compact />
        </Panel>
      </div>
    </AppShell>
  );
}
