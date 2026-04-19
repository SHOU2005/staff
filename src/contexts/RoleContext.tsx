import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  getSession, saveSession,
  type Session, type Role,
} from '../lib/data';

interface RoleContextValue {
  session:       Session | null;
  role:          Role | null;
  captainId:     string;
  captainName:   string;
  captainUPI:    string;
  isLoggedIn:    boolean;
  setSession:    (s: Session | null) => void;
  clearRole:     () => void;
}

const RoleContext = createContext<RoleContextValue>({
  session: null, role: null, captainId: '', captainName: '', captainUPI: '',
  isLoggedIn: false, setSession: () => {}, clearRole: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    setSessionState(getSession());
  }, []);

  const setSession = (s: Session | null) => {
    saveSession(s);
    setSessionState(s);
  };

  const clearRole = () => {
    saveSession(null);
    setSessionState(null);
  };

  // Resolve captain UPI from captains list
  const captainUPI = (() => {
    if (!session?.captainId) return '';
    try {
      const captains = JSON.parse(localStorage.getItem('switch_captains') || '[]');
      return captains.find((c: any) => c.id === session.captainId)?.upiId || '';
    } catch { return ''; }
  })();

  return (
    <RoleContext.Provider value={{
      session,
      role:        session?.role ?? null,
      captainId:   session?.captainId ?? '',
      captainName: session?.name ?? '',
      captainUPI,
      isLoggedIn:  !!session,
      setSession,
      clearRole,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() { return useContext(RoleContext); }
