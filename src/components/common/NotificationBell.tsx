import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Bot,
  ListTodo,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  notificationService,
  TeamoraNotification,
  NotificationPreferences,
} from '../../lib/notificationService.ts';

interface NotificationBellProps {
  orgId: string;
  onNavigate?: (tab: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ orgId, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<TeamoraNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'unread' | 'task' | 'agent' | 'approval'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences(orgId)
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync notifications on mount and subscribe to real-time events
  useEffect(() => {
    const updateData = () => {
      const items = notificationService.getNotifications(orgId, {
        category: categoryFilter,
      });
      setNotifications(items);
      setUnreadCount(notificationService.getUnreadCount(orgId));
      setPreferences(notificationService.getPreferences(orgId));
    };

    updateData();
    const unsubscribe = notificationService.subscribe(updateData);
    return unsubscribe;
  }, [orgId, categoryFilter]);

  // Outside click and Escape key dismissal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
        setShowSimulateMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowSettings(false);
        setShowSimulateMenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    notificationService.markAsRead(id, orgId);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    notificationService.deleteNotification(id, orgId);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(orgId);
  };

  const handleClearRead = () => {
    notificationService.clearReadHistory(orgId);
  };

  const handleNotificationClick = (item: TeamoraNotification) => {
    if (!item.isRead) {
      notificationService.markAsRead(item.id, orgId);
    }
    if (item.actionUrl && onNavigate) {
      onNavigate(item.actionUrl);
      setIsOpen(false);
    }
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = notificationService.updatePreferences(orgId, {
      [key]: !preferences[key],
    });
    setPreferences(updated);
  };

  const handleSimulate = (type: 'task_completion' | 'approval_needed' | 'agent_action' | 'system_alert') => {
    notificationService.simulateActivity(orgId, type);
    setShowSimulateMenu(false);
  };

  // Format relative timestamp with zero-pill unboxed style
  const formatTimeAgo = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Persistent Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Activity alerts and notifications"
        aria-expanded={isOpen}
        className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
          isOpen
            ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
            : 'text-[#211B2C] dark:text-[#F5F1E9] hover:bg-[#EBE5DB] dark:hover:bg-[#2C2438]'
        }`}
        title="Open Notification Feed"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B5CF6]" />

        {/* Live Unread Indicator Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-mono tabular-nums font-bold text-white bg-[#8B5CF6] rounded-full shadow-xs ring-2 ring-[#FFFEFC] dark:ring-[#211B2C]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">
                Activity Alerts
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-mono tabular-nums text-[#8B5CF6] bg-[#8B5CF6]/15 px-2 py-0.5 rounded-md font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Simulate Activity Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSimulateMenu((prev) => !prev)}
                  title="Simulate Real Activity Event"
                  className="p-1.5 rounded-lg text-[#77717D] hover:text-[#8B5CF6] hover:bg-[#F5F1E9] dark:hover:bg-[#382F47] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                {showSimulateMenu && (
                  <div className="absolute right-0 top-8 w-48 bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] rounded-xl shadow-xl py-1 z-60 text-xs">
                    <div className="px-3 py-1 text-[10px] uppercase font-mono text-[#77717D] border-b border-[#E2DBD0] dark:border-[#382F47]">
                      Simulate Event
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSimulate('task_completion')}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#211B2C] dark:text-[#F5F1E9] hover:bg-[#8B5CF6]/10 cursor-pointer flex items-center gap-2"
                    >
                      <ListTodo className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Task Completed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulate('approval_needed')}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#211B2C] dark:text-[#F5F1E9] hover:bg-[#8B5CF6]/10 cursor-pointer flex items-center gap-2"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-[#FF806E]" />
                      <span>Approval Needed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulate('agent_action')}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#211B2C] dark:text-[#F5F1E9] hover:bg-[#8B5CF6]/10 cursor-pointer flex items-center gap-2"
                    >
                      <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>Agent Action</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Preferences Settings Toggle */}
              <button
                type="button"
                onClick={() => setShowSettings((prev) => !prev)}
                title="Notification Settings"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showSettings
                    ? 'text-[#8B5CF6] bg-[#8B5CF6]/15'
                    : 'text-[#77717D] hover:text-[#211B2C] dark:hover:text-[#F5F1E9] hover:bg-[#F5F1E9] dark:hover:bg-[#382F47]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Mark All As Read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg text-[#77717D] hover:text-[#10B981] hover:bg-[#F5F1E9] dark:hover:bg-[#382F47] transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Preferences Sub-Panel (Collapsible) */}
          {showSettings && (
            <div className="p-3 bg-[#F5F1E9]/80 dark:bg-[#211B2C]/80 border-b border-[#E2DBD0] dark:border-[#382F47] text-xs space-y-2">
              <div className="font-semibold text-[#211B2C] dark:text-[#F5F1E9] text-[11px] uppercase tracking-wide">
                Alert Preferences
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePref('soundEnabled')}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#2C2438] cursor-pointer hover:border-[#8B5CF6]"
                >
                  {preferences.soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-[#77717D]" />
                  )}
                  <span className="truncate">Chime Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePref('taskAlerts')}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#2C2438] cursor-pointer hover:border-[#8B5CF6]"
                >
                  <Check
                    className={`w-3.5 h-3.5 ${
                      preferences.taskAlerts ? 'text-[#8B5CF6]' : 'text-transparent'
                    }`}
                  />
                  <span className="truncate">Task Events</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePref('approvalAlerts')}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#2C2438] cursor-pointer hover:border-[#8B5CF6]"
                >
                  <Check
                    className={`w-3.5 h-3.5 ${
                      preferences.approvalAlerts ? 'text-[#8B5CF6]' : 'text-transparent'
                    }`}
                  />
                  <span className="truncate">Approval Alerts</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePref('securityAlerts')}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#2C2438] cursor-pointer hover:border-[#8B5CF6]"
                >
                  <Check
                    className={`w-3.5 h-3.5 ${
                      preferences.securityAlerts ? 'text-[#8B5CF6]' : 'text-transparent'
                    }`}
                  />
                  <span className="truncate">Security Alerts</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Category Filter Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-[#E2DBD0] dark:border-[#382F47] bg-[#F5F1E9]/40 dark:bg-[#211B2C]/40 text-xs overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'task', label: 'Tasks' },
                { id: 'agent', label: 'Agents' },
                { id: 'approval', label: 'Approvals' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-[#8B5CF6] text-white shadow-xs'
                    : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C] dark:hover:text-[#F5F1E9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E2DBD0]/60 dark:divide-[#382F47]/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 mx-auto text-[#77717D]/40" />
                <p className="text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9]">
                  No notifications found
                </p>
                <p className="text-[11px] text-[#77717D]">
                  {categoryFilter === 'unread'
                    ? 'All alerts have been reviewed. Clean inbox!'
                    : 'Activity across your agents and workflows will show up here.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 transition-colors cursor-pointer relative group flex gap-3 ${
                    !item.isRead
                      ? 'bg-[#8B5CF6]/5 dark:bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/10'
                      : 'hover:bg-[#F5F1E9]/60 dark:hover:bg-[#382F47]/40'
                  }`}
                >
                  {/* Priority Color Bar */}
                  <div
                    className={`w-1 rounded-full shrink-0 ${
                      item.priority === 'urgent'
                        ? 'bg-[#FF806E]'
                        : item.priority === 'high'
                        ? 'bg-[#D97706]'
                        : item.priority === 'medium'
                        ? 'bg-[#8B5CF6]'
                        : 'bg-[#10B981]'
                    }`}
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Unboxed Metadata: Typographic Separator Discipline */}
                    <div className="flex items-center justify-between text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="capitalize font-medium text-[#211B2C] dark:text-[#F5F1E9]">
                          {item.entityType}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{formatTimeAgo(item.createdAt)}</span>
                        {item.priority === 'urgent' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#FF806E] font-bold">Urgent</span>
                          </>
                        )}
                      </div>

                      {/* Row Action Buttons on Hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(e, item.id)}
                            title="Mark as read"
                            className="p-1 rounded text-[#77717D] hover:text-[#10B981] hover:bg-[#FFFEFC] dark:hover:bg-[#2C2438]"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item.id)}
                          title="Delete notification"
                          className="p-1 rounded text-[#77717D] hover:text-[#FF806E] hover:bg-[#FFFEFC] dark:hover:bg-[#2C2438]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Headline */}
                    <div className="text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9] line-clamp-1">
                      {item.title}
                    </div>

                    {/* Body Prose */}
                    <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] line-clamp-2 leading-relaxed">
                      {item.message}
                    </div>

                    {/* 1-Click Navigation Cue */}
                    {item.actionUrl && (
                      <div className="pt-1 flex items-center gap-1 text-[10px] font-semibold text-[#8B5CF6] hover:underline">
                        <span>Open {item.actionUrl}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-[#F5F1E9]/60 dark:bg-[#211B2C]/60 border-t border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between text-[11px]">
              <span className="text-[#77717D] font-mono tabular-nums">
                {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'} cached
              </span>
              <button
                type="button"
                onClick={handleClearRead}
                className="text-[#77717D] hover:text-[#FF806E] transition-colors cursor-pointer"
              >
                Clear read history
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
