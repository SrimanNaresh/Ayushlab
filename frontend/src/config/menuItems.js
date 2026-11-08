// Single source of truth for every menu (desktop top bar, left side menu and
// the phone menu). Groups hold pages ({ key, label, to, perm? }) or nested
// nodes ({ label, submenu: [...] }) to any depth. `perm` is a permission from
// AuthContext's PERMS: pages a role can't use are left out of its menu (the
// server enforces the same rules). A group whose only page has the group's own
// name shows as a plain link.
export const MENU_GROUPS = [
  {
    group: 'Dashboard',
    items: [{ key: 'dashboard', label: 'Dashboard', to: '/' }],
  },
  {
    group: 'Patients',
    items: [{ key: 'patients', label: 'Patients', to: '/patients' }],
  },
  {
    group: 'Assignment',
    items: [
      { key: 'assignment.new', label: 'Assign Tests', to: '/assignments/new', perm: 'editAssignments' },
      { key: 'assignment.list', label: 'Assignment List', to: '/assignments' },
    ],
  },
  {
    group: 'Result Entry',
    items: [{ key: 'results.entry', label: 'Result Entry', to: '/results' }],
  },
  {
    group: 'Masters',
    items: [
      {
        label: 'Tests',
        submenu: [{ key: 'master.tests', label: 'Test Master', to: '/tests' }],
      },
      {
        label: 'Fees',
        submenu: [{ key: 'master.fees', label: 'Test Fee Master', to: '/fees' }],
      },
    ],
  },
  {
    group: 'Settings',
    items: [
      { key: 'settings.lab', label: 'Lab Settings', to: '/settings', perm: 'manageSettings' },
      { key: 'settings.users', label: 'User Master', to: '/users', perm: 'manageUsers' },
    ],
  },
];

function flattenLeaves(items, groupLabel) {
  return items.flatMap((it) => (it.submenu ? flattenLeaves(it.submenu, groupLabel) : [{ ...it, group: groupLabel }]));
}
export const ALL_MENU_ITEMS = MENU_GROUPS.flatMap((g) => flattenLeaves(g.items, g.group));
