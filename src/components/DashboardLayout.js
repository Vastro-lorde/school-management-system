import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import MenuIcon from './MenuIcon';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { signOut } from 'next-auth/react';

function SidebarItem({ item, depth = 0, expanded, onToggle }) {
  const hasChildren = item.children && item.children.length > 0;
  const isOpen = !!expanded[item._id];
  const paddingLeft = `${Math.min(depth, 6) * 12}px`;
  const isAncestorOnly = !!item.isAncestorOnly;

  return (
    <div style={{ paddingLeft }} className="pr-2">
      <div className="flex items-center justify-between">
        {item.url && !isAncestorOnly ? (
          <Link href={item.url} className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex-1">
            {item.icon ? <MenuIcon name={item.icon} /> : <span className="w-4" />}
            <span className="text-sm">{item.label}</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 py-2 px-3 rounded flex-1 select-none">
            {/* Hide icon for ancestor-only items */}
            {isAncestorOnly ? <span className="w-4" /> : (item.icon ? <MenuIcon name={item.icon} /> : <span className="w-4" />)}
            <span className="text-sm">{item.label}</span>
          </div>
        )}
        {hasChildren && (
          <button
            type="button"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            onClick={() => onToggle(item._id)}
            className="p-2 text-xs opacity-70 hover:opacity-100"
          >
            {isOpen ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="ml-2 border-l border-gray-200 dark:border-gray-700">
          {item.children.map(child => (
            <SidebarItem key={child._id} item={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ menu = [], children }) {
  const [expanded, setExpanded] = useState({});
  // collapsed by default; expand roots with current route in future enhancement
  const onToggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 p-3 hidden md:block">
        <div className="font-semibold text-lg px-2 py-3">Dashboard</div>
        <nav className="space-y-1">
          {menu.map(item => (
            <SidebarItem key={item._id} item={item} expanded={expanded} onToggle={onToggle} />
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between">
          <div className="font-medium">Welcome</div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="opacity-80 hover:opacity-100">Home</Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
