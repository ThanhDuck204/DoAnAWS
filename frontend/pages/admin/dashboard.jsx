import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiLoader,
  FiLock,
  FiPlus,
  FiShield,
  FiUsers,
  FiZap,
  FiChevronDown,
} from 'react-icons/fi';
import AppShell from '../../src/components/layout/AppShell';
import { useWorkspace } from '../../src/context/WorkspaceContext';

const quickActions = [
  { id: 'invite', label: 'Invite user', icon: FiPlus, color: 'from-blue-500 to-cyan-400' },
  { id: 'roles', label: 'Roles', icon: FiLock, color: 'from-amber-500 to-orange-400' },
];

export default function AdminDashboard() {
  const {
    currentUser, loading, workspaces,
    activeWorkspace, activeWorkspaceId, selectWorkspace,
    workspaceRole, workspaceTasks, workspaceMeetings,
    workspaceMembers, workspaceTeams,
  } = useWorkspace();
  const [activityFilter, setActivityFilter] = useState('all');
  const [activePanel, setActivePanel] = useState('overview');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
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

  // Scope data to active workspace
  const scopedTasks = useMemo(
    () => (workspaceTasks || []).filter((t) => t.workspaceId === activeWorkspace?.id || t.departmentId === activeWorkspace?.id),
    [workspaceTasks, activeWorkspace]
  );
  const scopedMeetings = useMemo(
    () => (workspaceMeetings || []).filter((m) => m.workspaceId === activeWorkspace?.id),
    [workspaceMeetings, activeWorkspace]
  );

  // Metrics computed from workspace data
  const metrics = useMemo(() => {
    const completedTasks = scopedTasks.filter((t) => t.status === 'COMPLETED').length;
    const processingMeetings = scopedMeetings.filter((m) => m.status === 'PROCESSING').length;
    const avgProgress = scopedTasks.length
      ? Math.round(scopedTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / scopedTasks.length)
      : 0;

    return [
      {
        label: 'Members',
        value: workspaceMembers.length,
        detail: `${workspaceTeams.length} teams`,
        icon: FiUsers,
        color: 'from-blue-500 to-cyan-400',
        progress: Math.min(100, workspaceMembers.length * 10),
      },
      {
        label: 'Teams',
        value: workspaceTeams.length,
        detail: `${workspaceMembers.length} members`,
        icon: FiBriefcase,
        color: 'from-violet-500 to-fuchsia-400',
        progress: Math.min(100, workspaceTeams.length * 25),
      },
      {
        label: 'Meetings',
        value: scopedMeetings.length,
        detail: processingMeetings ? `${processingMeetings} processing` : 'All processed',
        icon: FiFileText,
        color: 'from-amber-500 to-orange-400',
        progress: 64,
      },
      {
        label: 'Task progress',
        value: `${avgProgress}%`,
        detail: `${completedTasks} completed`,
        icon: FiCheckCircle,
        color: 'from-emerald-500 to-teal-400',
        progress: avgProgress,
      },
    ];
  }, [scopedTasks, scopedMeetings, workspaceMembers, workspaceTeams]);

  // Team workload (replaces department workload)
  const teamLoad = useMemo(() => {
    return workspaceTeams.map((team) => {
      const tasks = scopedTasks.filter((t) => t.teamId === team.id);
      const average = tasks.length
        ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
        : 0;
      return {
        id: team.id,
        name: team.name,
        members: team.memberIds?.length || 0,
        taskCount: tasks.length,
        overdue: tasks.filter((t) => t.status === 'OVERDUE' || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED')).length,
        completed: tasks.filter((t) => t.status === 'COMPLETED').length,
        progress: average,
      };
    });
  }, [workspaceTeams, scopedTasks]);

  const selectedTeam = useMemo(() => {
    return teamLoad.find((t) => t.id === selectedTeamId) || teamLoad[0] || null;
  }, [teamLoad, selectedTeamId]);

  const recentActivity = useMemo(() => {
    const latestMeetings = scopedMeetings.slice(0, 3).map((meeting) => ({
      id: meeting.id,
      type: 'meeting',
      title: meeting.title,
      detail: meeting.status === 'PROCESSING' ? 'AI is extracting tasks' : 'Meeting summary ready',
      time: meeting.updatedAt || meeting.createdAt,
      icon: FiFileText,
      color: 'bg-blue-50 text-blue-600',
    }));

    const latestTasks = scopedTasks.slice(0, 3).map((task) => ({
      id: task.id,
      type: 'task',
      title: task.title,
      detail: `${task.status.replace('_', ' ')} - ${task.progress || 0}%`,
      time: task.updatedAt || task.createdAt,
      icon: FiCheckCircle,
      color: 'bg-emerald-50 text-emerald-600',
    }));

    return [...latestMeetings, ...latestTasks].slice(0, 5);
  }, [scopedMeetings, scopedTasks]);

  const filteredActivity = useMemo(() => {
    return recentActivity.filter((a) => activityFilter === 'all' || a.type === activityFilter);
  }, [activityFilter, recentActivity]);

  const workflowSteps = [
    { label: 'Upload', value: scopedMeetings.length, icon: FiFileText },
    { label: 'AI Summary', value: scopedMeetings.filter((m) => m.aiSummary || m.summary).length, icon: FiZap },
    { label: 'Task Extracted', value: scopedTasks.length, icon: FiCheckCircle },
    { label: 'Assigned', value: scopedTasks.filter((t) => t.assigneeId).length, icon: FiUsers },
  ];

  const handleScrollToPanel = (panelId) => {
    setActivePanel(panelId);
    requestAnimationFrame(() => {
      document.getElementById('admin-action-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <FiLoader className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Loading admin workspace...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <FiLock className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Please log in to view dashboard.</p>
          <Link href="/login" className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Workspace picker — no workspace selected
  if (!activeWorkspace) {
    return (
      <AppShell user={user} showWorkspaceSwitcher={false}>
        <div className="mx-auto mt-20 max-w-lg px-4 text-center">
          <FiBriefcase className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Select a workspace</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Choose a workspace to view its dashboard.
          </p>
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

  // User doesn't have OWNER role in this workspace
  if (workspaceRole !== 'OWNER') {
    return (
      <AppShell user={user} showWorkspaceSwitcher={false}>
        <div className="mx-auto mt-20 max-w-lg px-4 text-center">
          <FiLock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Owner access required</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You need the Owner role in <strong>{activeWorkspace.name}</strong> to view this dashboard.
          </p>
          <Link href="/workspace" className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white">
            Go to Workspace
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user} showWorkspaceSwitcher={false}>
      {/* Workspace selector dropdown */}
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

      {/* Hero section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-hero-main overflow-hidden rounded-2xl p-[1px] shadow-xl shadow-blue-900/10"
      >
        <div className="dashboard-shimmer relative overflow-hidden rounded-2xl bg-white/96 dark:bg-slate-900/80 p-6 backdrop-blur">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-blue-50/90 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/90" />
          <div className="absolute right-8 top-4 h-36 w-36 rounded-full bg-pink-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-40 h-28 w-28 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-bold text-primary-700 dark:text-primary-300">
                {activeWorkspace.name} — Owner dashboard
              </p>
              <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-normal text-slate-950 dark:text-slate-100 lg:text-4xl">
                Turn meetings into tasks, track your workspace execution.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Monitor {workspaceMembers.length} members, {workspaceTeams.length} teams, and all tasks from one workspace view.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/workspace?view=meetings"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
                >
                  <FiZap className="h-4 w-4" />
                  Upload MP3 for AI summary
                </Link>
                <Link
                  href="/workspace"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FiBriefcase className="h-4 w-4" />
                  Open workspace
                </Link>
              </div>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="dashboard-hero-scene hidden lg:block">
                <div className="dashboard-hero-stack">
                  <span className="dashboard-hero-card" />
                  <span className="dashboard-hero-card" />
                  <span className="dashboard-hero-card" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-3 shadow-sm">
                {['Live', 'AI Ready', 'Secure'].map((label, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center"
                  >
                    <div className="mx-auto mb-2 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Metrics */}
      <section className="mt-6 grid gap-4 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </section>

      {/* Team workload + Selected team */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100">Team workload</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Progress and capacity across teams.</p>
            </div>
            <FiBarChart2 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="space-y-5">
            {teamLoad.map((team, index) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                className={`w-full rounded-xl p-3 text-left transition ${
                  selectedTeamId === team.id ? 'bg-blue-50 dark:bg-slate-800 ring-1 ring-blue-100 dark:ring-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{team.name}</span>
                    <span className="ml-2 text-slate-400 dark:text-slate-500">{team.members} members</span>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{team.progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${team.progress}%` }}
                    transition={{ delay: 0.35 + index * 0.08, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-sky-400"
                  />
                </div>
              </button>
            ))}
            {teamLoad.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
                No teams yet. Create teams to track workload.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100">Selected team</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Click a team to inspect workload.</p>
            </div>
            <FiBriefcase className="h-5 w-5 text-primary-500 dark:text-primary-400" />
          </div>
          {selectedTeam && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-sm text-slate-300">{selectedTeam.name}</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <TeamStat label="Members" value={selectedTeam.members} />
                  <TeamStat label="Tasks" value={selectedTeam.taskCount} />
                  <TeamStat label="Done" value={selectedTeam.completed} />
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Delivery progress</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">{selectedTeam.progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white dark:bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedTeam.progress}%` }}
                    transition={{ duration: 0.55 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/20 px-4 py-3 text-sm">
                <span className="font-semibold text-orange-800 dark:text-orange-300">Overdue tasks</span>
                <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1 font-bold text-orange-700 dark:text-orange-400">
                  {selectedTeam.overdue}
                </span>
              </div>
            </div>
          )}
          {!selectedTeam && (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
              Select a team above to see details.
            </div>
          )}
        </motion.div>
      </section>

      {/* Quick actions + Activity */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100">Quick actions</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Common owner operations.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => handleScrollToPanel(action.id)}
                className="float-action group rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-4 text-left transition hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-200/70 dark:hover:shadow-slate-950/70"
                style={{ animationDelay: `${quickActions.findIndex((item) => item.id === action.id) * 0.18}s` }}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{action.label}</span>
                  <FiChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 transition group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
          <div id="admin-action-panel">
            <ActionPanel activePanel={activePanel} workspace={activeWorkspace} members={workspaceMembers} tasks={scopedTasks} />
          </div>
          <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
            <h3 className="text-sm font-bold">Core workflow</h3>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.06 }}
                  className="rounded-xl bg-white/10 p-3"
                >
                  <step.icon className="mb-2 h-4 w-4 text-cyan-300" />
                  <div className="text-lg font-bold">{step.value}</div>
                  <div className="text-[11px] text-slate-300">{step.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100">Recent activity</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest meetings and tasks in this workspace.</p>
            </div>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              {['all', 'meeting', 'task'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActivityFilter(item)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    activityFilter === item ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filteredActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.52 + index * 0.07 }}
                className="flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-3"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activity.color}`}>
                  <activity.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{activity.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activity.detail}</p>
                </div>
                <div className="hidden items-center gap-1 text-xs text-slate-400 dark:text-slate-500 sm:flex">
                  <FiClock className="h-3.5 w-3.5" />
                  {activity.time ? new Date(activity.time).toLocaleDateString() : '—'}
                </div>
              </motion.div>
            ))}
            {filteredActivity.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No activity yet. Upload a meeting or create a task to get started.
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </AppShell>
  );
}

function TeamStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[11px] text-slate-300">{label}</div>
    </div>
  );
}

function ActionPanel({ activePanel, workspace, members, tasks }) {
  const panelTitle = {
    overview: 'Workspace overview',
    invite: 'Invite member preview',
    roles: 'Role overview',
  }[activePanel];

  return (
    <motion.div
      key={activePanel}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-950 dark:text-slate-100">{panelTitle}</h3>
        <Link
          href="/workspace?view=meetings"
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700"
        >
          Upload MP3
        </Link>
      </div>

      {activePanel === 'overview' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <OverviewTile icon={FiUsers} label="Members" value={members.length} />
          <OverviewTile icon={FiBriefcase} label="Teams" value={workspace.teams?.length || 0} />
          <OverviewTile icon={FiCheckCircle} label="Tracked tasks" value={tasks.length} />
          <button
            type="button"
            onClick={() => {
              document.getElementById('admin-overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-white dark:hover:bg-slate-700 sm:col-span-3"
          >
            Jump back to top metrics
          </button>
        </div>
      )}

      {activePanel === 'invite' && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              readOnly
              value="member@email.com"
              className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-500 dark:text-slate-400"
            />
            <select className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-600 dark:text-slate-300" defaultValue="EMPLOYEE">
              <option>EMPLOYEE</option>
              <option>MANAGER</option>
              <option>VICE_ADMIN</option>
            </select>
          </div>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            Invite form preview. Send invitations from the workspace members panel.
          </p>
        </div>
      )}

      {activePanel === 'roles' && (
        <div className="grid grid-cols-3 gap-2">
          {['OWNER', 'MANAGER', 'EMPLOYEE'].map((role) => (
            <div key={role} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-center">
              <div className="text-xl font-bold text-slate-950 dark:text-slate-100">
                {members.filter((m) => m.role === role).length}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{role}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function OverviewTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
      <Icon className="mb-3 h-4 w-4 text-primary-600 dark:text-primary-400" />
      <div className="text-xl font-bold text-slate-950 dark:text-slate-100">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function MetricCard({ metric, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.07 }}
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{metric.label}</p>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.08 }}
            className="mt-3 text-3xl font-bold tracking-normal text-slate-950 dark:text-slate-100"
          >
            {metric.value}
          </motion.div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${metric.color} text-white shadow-lg`}>
          <metric.icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>{metric.detail}</span>
        <span>{metric.progress}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${metric.progress}%` }}
          transition={{ delay: 0.35 + index * 0.07, duration: 0.75, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
        />
      </div>
    </motion.div>
  );
}
