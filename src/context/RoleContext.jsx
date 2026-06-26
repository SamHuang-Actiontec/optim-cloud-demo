import { createContext, useContext, useState } from 'react'

const RoleContext = createContext()

// Modes: 'engineer', 'isp-admin', or 'operator'
const DEFAULT_ROLE = 'engineer'

export function RoleProvider({ children }) {
  const [role, setRole] = useState(DEFAULT_ROLE)

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within RoleProvider')
  }
  return context
}
