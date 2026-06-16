import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiLoader,
  FiUploadCloud,
  FiUsers,
  FiChevronDown,
  FiLock,
} from 'react-icons/fi';
import AppShell from '../../src/components/layout/AppShell';
import { useWorkspace } from '../../src/context/WorkspaceContext';

export default function ManagerDashboard() {
  const {
    currentUser, loading, workspaces,
    activeWorkspace, activeWorkspaceId, selectWorkspace,
    workspaceRole, workspaceTasks, workspaceMeetings,
    workspaceMembers, workspaceTeams,
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

  // Only show workspaces the user is a member of
  const myWorkspaces = useMemo(() => {
    if (!currentUser) return [];
    return workspaces.filter((ws) =>
      ws.members?.some((m) => m.userId === currentUser.id)
    );
  }, [workspaces, currentUser]);

  const isManagerOrAbove = ['OWNER', 'VICE_ADMIN', 'MANAGER'].includes(workspaceRole);

  // Scope data to active workspace
  const scopedTasks = useMemo(
    () => (workspaceTasks || []).filter((t) => t.workspaceId === activeWorkspace?.id || t.departmentId === activeWorkspace?.id),
    [workspaceTasks, activeWorkspace]
  );
  const scopedMeetings = useMemo(
    () => (workspaceMeetings || []).filter((m) => m.workspaceId === activeWorkspace?.id),
    [workspaceMeetings, activeWorkspace]
  );

  // Compute dashboard from workspace data
  const dashboard = useMemo(() => {
    if (!activeWorkspace || !currentUser) return null;

    const teamMembers = workspaceMembers;
    const departmentTasks = scopedTasks;
    const departmentMeetings = scopedMeetings
      .sort((a, b) => new Date(b.createdAt || b.createdAt) - new Date(a.createdAt || a.createdAt));

    const completed = departmentTasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgress = departmentTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const overdue = departmentTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED').length;
    const avgProgress = departmentTasks.length
      ? Math.round(departmentTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / departmentTasks.length)
      : 0;

    const workload = teamMembers.map((member) => {
      const tasks = departmentTasks.filter((t) => t.assigneeId === member.userId);
      const memberOverdue = tasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED');
      return {
        id: member.userId,
        name: member.name || member.nickname || 'Unknown',
        role: member.role || 'EMPLOYEE',
        tasks: tasks.length,
        overdue: memberOverdue.length,
        progress: tasks.length
          ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
          : 0,
      };
    });

    return {
      activeWorkspace,
      teamMembers,
      departmentTasks,
      departmentMeetings,
      completed, inProgress, overdue, avgProgress, workload,
    };
  }, [activeWorkspace, currentUser, workspaceMembers, workspaceTasks, workspaceMeetings]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <FiLoader className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading manager workspace...</p>
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
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose a workspace to view its management dashboard.</p>
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

  // Role check: at least MANAGER
  if (!isManagerOrAbove) {
    return (
      <AppShell user={user} showWorkspaceSwitcher={false}>
        <div className="mx-auto mt-20 max-w-lg px-4 text-center">
          <FiLock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Manager access required</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You need Manager role or above in <strong>{activeWorkspace.name}</strong>.
          </p>
          <Link href="/workspace" className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white">Go to Workspace</Link>
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

  return (
    <AppShell
      user={user}
      eyebrow={dashboard.activeWorkspace?.name || 'Manager workspace'}
      title="Team execution overview"
      description="Review meeting outcomes, task progress, and team capacity from one focused command view."
      actions={
        <>
          <Link href="/workspace?view=meetings" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#fbfcfe] dark:bg-slate-900 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800">
            <FiFileText className="h-4 w-4" />
            Meetings
          </Link>
          <Link href="/workspace?view=meetings" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-700">
            <FiUploadCloud className="h-4 w-4" />
            Upload
          </Link>
        </>
      }
    >
      {/* Workspace selector */}
      <div className="relative mb-4">
        <button
          type="button"
          onClick={() => setShowWsPicker(!showWsPicker)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <FiBriefcase className="h-4 w-4" />
          {dashboard.activeWorkspace.name}
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
        <StatCard label="Total tasks" value={dashboard.departmentTasks.length} detail={`${dashboard.avgProgress}% average progress`} icon={FiBriefcase} tone="blue" />
        <StatCard label="Completed" value={dashboard.completed} detail="Ready for review" icon={FiCheckCircle} tone="green" />
        <StatCard label="In progress" value={dashboard.inProgress} detail="Actively moving" icon={FiBarChart2} tone="amber" />
        <StatCard label="Overdue" value={dashboard.overdue} detail="Needs manager attention" icon={FiAlertTriangle} tone={dashboard.overdue ? 'red' : 'slate'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Team workload"
          description={`${dashboard.teamMembers.length} members in ${dashboard.activeWorkspace.name}`}
        >
          <div className="space-y-3">
            {dashboard.workload.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{member.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">{member.role}</span>
                  </div>
                  <div className="mt-2 h-2 w-full max-w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${member.progress}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-sky-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">{member.tasks} tasks</span>
                  {member.overdue > 0 && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <FiAlertTriangle className="h-3.5 w-3.5" />{member.overdue}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {dashboard.workload.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
                No members with tasks yet.
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Recent meetings" description={`${dashboard.departmentMeetings.length} meetings uploaded`}>
          <div className="space-y-3">
            {dashboard.departmentMeetings.slice(0, 5).map((meeting) => (
              <Link
                key={meeting.id}
                href={`/manager/meetings/${meeting.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-3 transition hover:bg-white dark:hover:bg-slate-700"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <FiFileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{meeting.title || 'Untitled meeting'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {meeting.status || 'DRAFT'} — {meeting.createdAt ? new Date(meeting.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <FiCalendar className="h-4 w-4 flex-shrink-0 text-slate-400" />
              </Link>
            ))}
            {dashboard.departmentMeetings.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
                No meetings uploaded yet.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
