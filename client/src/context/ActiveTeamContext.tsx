import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ActiveTeam = {
  id: number | null;
  name: string | null;
};

type ActiveTeamContextValue = {
  activeTeamId: number | null;
  activeTeamName: string | null;
  setActiveTeam: (team: { id: number; name: string } | null) => void;
};

const ActiveTeamContext = createContext<ActiveTeamContextValue | undefined>(
  undefined,
);

export function ActiveTeamProvider({ children }: { children: ReactNode }) {
  const [activeTeam, setActiveTeamState] = useState<ActiveTeam>(() => {
    if (typeof window === "undefined") {
      return { id: null, name: null };
    }
    const idStr = localStorage.getItem("activeTeamId");
    const name = localStorage.getItem("activeTeamName");
    const id = idStr ? Number(idStr) : null;
    return { id, name };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (activeTeam.id != null) {
      localStorage.setItem("activeTeamId", String(activeTeam.id));
    } else {
      localStorage.removeItem("activeTeamId");
    }

    if (activeTeam.name) {
      localStorage.setItem("activeTeamName", activeTeam.name);
    } else {
      localStorage.removeItem("activeTeamName");
    }
  }, [activeTeam]);

  const setActiveTeam = (team: { id: number; name: string } | null) => {
    if (!team) {
      setActiveTeamState({ id: null, name: null });
    } else {
      setActiveTeamState({ id: team.id, name: team.name });
    }
  };

  return (
    <ActiveTeamContext.Provider
      value={{
        activeTeamId: activeTeam.id,
        activeTeamName: activeTeam.name,
        setActiveTeam,
      }}
    >
      {children}
    </ActiveTeamContext.Provider>
  );
}

export function useActiveTeam() {
  const ctx = useContext(ActiveTeamContext);
  if (!ctx) {
    throw new Error("useActiveTeam must be used within an ActiveTeamProvider");
  }
  return ctx;
}

