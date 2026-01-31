'use client';

import * as React from 'react';
import type { CustomerDto, VisitDto } from '../../lib/api';

export type RegisterContextValue = {
  selectedCustomer: CustomerDto | null;
  setSelectedCustomer: (customer: CustomerDto | null) => void;
  activeVisit: VisitDto | null;
  setActiveVisit: (visit: VisitDto | null) => void;
};

const RegisterContext = React.createContext<RegisterContextValue | undefined>(undefined);

export function RegisterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerDto | null>(null);
  const [activeVisit, setActiveVisit] = React.useState<VisitDto | null>(null);

  const value = React.useMemo(
    () => ({ selectedCustomer, setSelectedCustomer, activeVisit, setActiveVisit }),
    [selectedCustomer, activeVisit]
  );

  return <RegisterContext.Provider value={value}>{children}</RegisterContext.Provider>;
}

export function useRegisterContext() {
  const context = React.useContext(RegisterContext);
  if (!context) {
    throw new Error('useRegisterContext must be used within RegisterProvider');
  }
  return context;
}
