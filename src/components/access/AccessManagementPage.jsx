import { useState } from 'react'
import { Mail, Plus, Trash2, X, Shield, Users, CheckCircle2, Send } from 'lucide-react'

// Available features/functions for each role
const AVAILABLE_FEATURES = [
  'View Dashboard',
  'View Network',
  'Manage Network',
  'View Subscribers',
  'Manage Subscribers',
  'View Inventory',
  'Manage Inventory',
  'Access Data Element',
  'Configure Firmware',
  'View Reports',
  'Manage Access',
  'System Settings',
]

// Mock roles with initial permissions
const INITIAL_ROLES = [
  {
    id: 'operator',
    name: 'Operator',
    description: 'Service operations staff',
    features: ['View Dashboard', 'View Network', 'View Subscribers', 'View Inventory'],
  },
  {
    id: 'engineer',
    name: 'Engineer',
    description: 'Technical engineering staff',
    features: [
      'View Dashboard',
      'View Network',
      'Manage Network',
      'View Subscribers',
      'View Inventory',
      'Manage Inventory',
      'Access Data Element',
      'Configure Firmware',
    ],
  },
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    description: 'Analytics and reporting',
    features: ['View Dashboard', 'View Network', 'View Subscribers', 'View Inventory', 'View Reports'],
  },
  {
    id: 'isp-admin',
    name: 'ISP Admin',
    description: 'Platform administrator',
    features: AVAILABLE_FEATURES,
  },
]

// Mock invited employees
const INITIAL_EMPLOYEES = [
  { id: 'emp-01', name: 'John Smith', email: 'john.smith@company.com', role: 'operator', status: 'active', joinedDate: '2025-06-10' },
  { id: 'emp-02', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'engineer', status: 'active', joinedDate: '2025-06-15' },
  { id: 'emp-03', name: 'Mike Chen', email: 'mike.chen@company.com', role: 'business-analyst', status: 'active', joinedDate: '2025-06-18' },
  { id: 'emp-04', name: 'Lisa Brown', email: 'lisa.brown@company.com', role: 'engineer', status: 'pending', joinedDate: null },
]

function RoleCard({ role, onUpdate, onRemoveFeature, onAddFeature }) {
  const [showFeatures, setShowFeatures] = useState(false)

  return (
    <div className="rounded-xl border border-noc-border bg-noc-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-noc-border bg-noc-raised/20 flex items-center justify-between cursor-pointer" onClick={() => setShowFeatures(!showFeatures)}>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-noc-info" />
          <div>
            <h3 className="font-bold text-noc-fg">{role.name}</h3>
            <p className="text-xs text-noc-muted">{role.description}</p>
          </div>
        </div>
        <div className="text-xs font-bold text-noc-info bg-noc-info/10 px-2 py-1 rounded">
          {role.features.length} features
        </div>
      </div>

      {showFeatures && (
        <div className="p-4 space-y-2">
          {AVAILABLE_FEATURES.map((feature) => {
            const hasFeature = role.features.includes(feature)
            return (
              <div key={feature} className="flex items-center justify-between p-2 rounded-lg hover:bg-noc-raised/20">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={hasFeature}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onAddFeature(role.id, feature)
                      } else {
                        onRemoveFeature(role.id, feature)
                      }
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-noc-fg">{feature}</span>
                </label>
              </div>
            )
          })}

          <div className="pt-2 border-t border-noc-border mt-3">
            <button
              type="button"
              onClick={() => {
                onUpdate(role.id)
                setShowFeatures(false)
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-noc-info text-white text-xs font-bold hover:bg-noc-info/90 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmployeeRow({ employee, onRemove, roleMap }) {
  const statusColor = employee.status === 'active' ? 'text-noc-accent' : 'text-noc-warning'
  const statusBg = employee.status === 'active' ? 'bg-noc-accent/10' : 'bg-noc-warning/10'

  return (
    <tr className="border-b border-noc-border/60 hover:bg-noc-raised/25">
      <td className="px-4 py-2.5 text-sm text-noc-fg font-semibold">{employee.name}</td>
      <td className="px-4 py-2.5 text-sm text-noc-muted">{employee.email}</td>
      <td className="px-4 py-2.5 text-sm text-noc-fg">{roleMap[employee.role]}</td>
      <td className="px-4 py-2.5 text-sm">
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${statusBg} ${statusColor}`}>
          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm text-noc-muted">{employee.joinedDate || 'Pending'}</td>
      <td className="px-4 py-2.5 text-right">
        <button
          type="button"
          onClick={() => onRemove(employee.id)}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-noc-muted hover:text-noc-danger hover:bg-noc-danger/10 cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}

export default function AccessManagementPage({ onLog }) {
  const [roles, setRoles] = useState(INITIAL_ROLES)
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'operator' })
  const [successMessage, setSuccessMessage] = useState('')

  const roleMap = roles.reduce((acc, role) => {
    acc[role.id] = role.name
    return acc
  }, {})

  function updateRole(roleId) {
    onLog?.('ACCESS_ROLE_UPDATED', { roleId })
    setSuccessMessage('✓ Role permissions saved successfully')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  function removeFeature(roleId, feature) {
    setRoles((current) =>
      current.map((r) =>
        r.id === roleId ? { ...r, features: r.features.filter((f) => f !== feature) } : r
      )
    )
  }

  function addFeature(roleId, feature) {
    setRoles((current) =>
      current.map((r) =>
        r.id === roleId && !r.features.includes(feature)
          ? { ...r, features: [...r.features, feature] }
          : r
      )
    )
  }

  function sendInvite(event) {
    event.preventDefault()
    const { name, email, role } = inviteForm
    if (!name.trim() || !email.trim()) return

    const newEmployee = {
      id: `emp-${Date.now()}`,
      name,
      email,
      role,
      status: 'pending',
      joinedDate: null,
    }

    setEmployees((current) => [newEmployee, ...current])
    onLog?.('ACCESS_EMPLOYEE_INVITED', { name, email, role })
    setSuccessMessage(`✓ Invite sent to ${email}`)
    setTimeout(() => setSuccessMessage(''), 3000)
    setInviteForm({ name: '', email: '', role: 'operator' })
    setShowInviteForm(false)
  }

  function removeEmployee(employeeId) {
    setEmployees((current) => current.filter((e) => e.id !== employeeId))
    onLog?.('ACCESS_EMPLOYEE_REMOVED', { employeeId })
  }

  return (
    <div className="dashboard-tech-bg flex-1 overflow-y-auto scrollbar-dark bg-noc-bg">
      <div className="dashboard-search-band px-6 py-4 border-b border-noc-border">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-[14px] font-extrabold tracking-[0.08em] uppercase text-noc-label">Access Management</h2>
            <p className="text-noc-muted/90 text-sm mt-1">Configure role permissions and manage employee access to the platform.</p>
          </div>
        </div>
      </div>

      <section className="dashboard-ops-band dashboard-ops-band-last space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="rounded-xl border border-noc-accent/30 bg-noc-accent/10 p-3 flex items-center justify-between">
            <p className="text-sm font-bold text-noc-accent">{successMessage}</p>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-noc-accent hover:text-noc-accent/70"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Role Management Section */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-noc-label mb-3 px-1">Role Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onUpdate={updateRole}
                onRemoveFeature={removeFeature}
                onAddFeature={addFeature}
              />
            ))}
          </div>
        </div>

        {/* Employee Management Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-noc-label">Employees & Access</h3>
            <button
              type="button"
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-noc-info text-white text-xs font-bold hover:bg-noc-info/90 cursor-pointer"
            >
              <Plus size={13} />
              Invite Employee
            </button>
          </div>

          <div className="rounded-xl border border-noc-border bg-noc-surface overflow-hidden">
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-noc-raised/40 border-b border-noc-border sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Name</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Email</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Role</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Status</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Joined</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <EmployeeRow
                      key={employee.id}
                      employee={employee}
                      onRemove={removeEmployee}
                      roleMap={roleMap}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Invite Employee Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-noc-border bg-noc-surface">
            <div className="flex items-center justify-between px-4 py-3 border-b border-noc-border">
              <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-noc-label flex items-center gap-2">
                <Users size={14} />
                Invite Employee
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-noc-muted hover:text-noc-fg cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={sendInvite} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-noc-label mb-1.5">
                  Full Name
                </label>
                <input
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-noc-label mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="john.smith@company.com"
                  className="w-full h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-noc-label mb-1.5">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg bg-noc-info/10 border border-noc-info/20 p-3">
                <p className="text-xs text-noc-fg flex items-start gap-2">
                  <Mail size={13} className="shrink-0 mt-0.5" />
                  <span>An invitation email will be sent to <strong>{inviteForm.email}</strong> with a sign-up link.</span>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="h-9 px-3 rounded-lg border border-noc-border text-xs font-bold text-noc-fg hover:border-noc-info/50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inviteForm.name.trim() || !inviteForm.email.trim()}
                  className="h-9 px-3 rounded-lg bg-noc-info text-white text-xs font-bold hover:bg-noc-info/90 disabled:opacity-40 disabled:cursor-default cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Send size={12} />
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
