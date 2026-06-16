import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiLoader,
  FiLock,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiZap,
  FiChevronDown,
} from 'react-icons/fi';
import AppShell, { Panel, StatCard, StatusPill, LoadingState } from '../../src/components/layout/AppShell';
import { useWorkspace } from '../../src/context/WorkspaceContext';

export default function AdminAnalytics() {
  const {
    currentUser, loading, workspaces,
    activeWorkspace, activeWorkspaceId, selectWorkspace,
    workspaceRole, workspaceTasks, workspaceMeetings, workspaceMembers,
  } = useWorkspace();
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

  // Scope data to active workspace
  const scopedTasks = useMemo(
    () => (workspaceTasks || []).filter(
      (t) => t.workspaceId === activeWorkspace?.id || t.departmentId === activeWorkspace?.id
    ),
    [workspaceTasks, activeWorkspace]
  );
  const scopedMeetings = useMemo(
    () => (workspaceMeetings || []).filter(
      (m) => m.workspaceId === activeWorkspace?.id
    ),
    [workspaceMeetings, activeWorkspace]
  );

  const analytics = useMemo(() => {
    if (!activeWorkspace) return null;

    const totalMembers = workspaceMembers.length;
    const totalMeetings = scopedMeetings.length;
    const completedMeetings = scopedMeetings.filter((m) => m.status === 'COMPLETED').length;
    const processingMeetings = scopedMeetings.filter((m) => m.status === 'PROCESSING').length;

    const totalTasks = scopedTasks.length;
    const completedTasks = scopedTasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgressTasks = scopedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const pendingTasks = scopedTasks.filter((t) => t.status === 'PENDING').length;
    const overdueTasks = scopedTasks.filter(
      (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED'
    ).length;

    const avgProgress = totalTasks
      ? Math.round(scopedTasks.reduce((s, t) => s + t.progress, 0) / totalTasks)
      : 0;

    // Group tasks by assignee for productivity
    const memberProductivity = workspaceMembers.map((m) => {
      const memberTasks = scopedTasks.filter((t) => t.assigneeId === m.userId);
      const done = memberTasks.filter((t) => t.status === 'COMPLETED').length;
      return {
        name: m.name || m.nickname || 'Unknown',
        total: memberTasks.length,
        completed: done,
        rate: memberTasks.length ? Math.round((done / memberTasks.length) * 100) : 0,
      };
    }).filter((p) => p.total > 0);

    const roleDist = {};
    workspaceMembers.forEach((m) => {
      const role = m.role || 'EMPLOYEE';
      roleDist[role] = (roleDist[role] || 0) + 1;
    });

    return {
      activeUsers: totalMembers,
      totalMeetings,
      completedMeetings,
      processingMeetings,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      avgProgress,
      memberProductivity,
      roleDist,
      workspaceName: activeWorkspace.name,
    };
  }, [activeWorkspace, workspaceMembers, workspaceTasks, workspaceMeetings]);

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
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose a workspace to view its analytics.</p>
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
            You need the Owner role in <strong>{activeWorkspace.name}</strong> to view analytics.
          </p>
          <Link href="/workspace" className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white">Go to Workspace</Link>
        </div>
      </AppShell>
    );
  }

  if (!analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-950">
        <FiLoader className="mx-auto h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      eyebrow={activeWorkspace?.name || 'Admin'}
      title="Workspace analytics"
      description={`High-level metrics for ${analytics.workspaceName}`}
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
        <StatCard label="Active members" value={analytics.activeUsers} detail="Workspace members" icon={FiUsers} tone="blue" />
        <StatCard label="Meetings" value={analytics.totalMeetings} detail={`${analytics.completedMeetings} completed`} icon={FiFileText} tone="amber" />
        <StatCard label="Tasks" value={analytics.totalTasks} detail={`${analytics.completedTasks} completed`} icon={FiCheckCircle} tone="green" />
        <StatCard label="Avg progress" value={`${analytics.avgProgress}%`} detail="Workspace-wide" icon={FiTrendingUp} tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Member productivity */}
        <Panel title="Member productivity" description="Completion rate per member">
          <div className="space-y-4">
            {analytics.memberProductivity.map((mp, idx) => (
              <div key={mp.name} className="flex items-center gap-4">
                <span className="w-28 text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{mp.name}</span>
                <div className="flex-1 h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${mp.rate}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.06 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-sky-400"
                    style={{ minWidth: mp.rate ? '20px' : 0 }}
                  />
                </div>
                <span className="w-16 text-right text-xs font-bold text-slate-700 dark:text-slate-300">
                  {mp.completed}/{mp.total}
                </span>
              </div>
            ))}
            {analytics.memberProductivity.length === 0 && (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">
                No tasks assigned yet.
              </p>
            )}
          </div>
        </Panel>

        {/* Role distribution */}
        <Panel title="Role distribution" description="Member breakdown by role">
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(analytics.roleDist).map(([role, count]) => {
              const max = Math.max(...Object.values(analytics.roleDist), 1);
              const colorSet = role === 'OWNER'
                ? { icon: FiBarChart2, from: 'from-red-500 to-rose-400' }
                : role === 'VICE_ADMIN'
                  ? { icon: FiShield, from: 'from-purple-500 to-violet-400' }
                  : role === 'MANAGER'
                    ? { icon: FiBriefcase, from: 'from-amber-500 to-orange-400' }
                    : { icon: FiUsers, from: 'from-emerald-500 to-teal-400' };
              return (
                <div key={role} className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
                  <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorSet.from} text-white shadow-lg`}>
                    <colorSet.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{role}</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / max) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full rounded-full bg-gradient-to-r ${colorSet.from}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Pipeline overview */}
      <Panel title="Workflow pipeline" description="End-to-end metrics: upload → summary → tasks → completion" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Meetings uploaded', value: analytics.totalMeetings, icon: FiFileText, color: 'bg-blue-50 text-blue-600' },
            { label: 'AI summaries ready', value: analytics.completedMeetings, icon: FiZap, color: 'bg-primary-50 text-primary-600' },
            { label: 'Tasks extracted', value: analytics.totalTasks, icon: FiCheckCircle, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Overdue items', value: analytics.overdueTasks, icon: FiCalendar, color: analytics.overdueTasks ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              className="flex items-center gap-4 rounded-lg border border-slate-200/80 bg-[#fbfcfe] p-4 dark:border-slate-800 dark:bg-[#17212c]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
