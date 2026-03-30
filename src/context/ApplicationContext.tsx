import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Application } from '../types';
import { applicationsApi } from '../lib/api';
import { useAuth } from './AuthContext';

interface ApplicationContextType {
  applications: Application[];
  isLoading: boolean;
  addApplication: (app: Omit<Application, 'id' | 'status'> & {
    petId: string;
    applicantPhone?: string;
    applicantAddress?: string;
    applicantWechat?: string;
    housingType?: string;
    housingDescription?: string;
    hasOutdoorSpace?: boolean;
    experienceLevel?: string;
  }) => Promise<void>;
  updateApplicationStatus: (id: string, status: 'approved' | 'rejected' | 'reviewing') => Promise<void>;
  refreshApplications: () => Promise<void>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshApplications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [myRes, receivedRes] = await Promise.all([
        applicationsApi.getMy(),
        applicationsApi.getReceived(),
      ]);

      const myApps: Application[] = myRes.success
        ? (myRes.data || []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            petName: a.petName as string,
            petBreed: a.petBreed as string,
            petAge: a.petAge as string,
            petImage: (a.petImage as string) || '',
            status: a.status as 'approved' | 'reviewing' | 'rejected',
            type: 'adoption' as const,
            petId: a.petId as string,
            applicantName: a.applicantName as string,
            applicantBio: a.applicantBio as string,
          }))
        : [];

      const receivedApps: Application[] = receivedRes.success
        ? (receivedRes.data || []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            petName: a.petName as string,
            petBreed: a.petBreed as string,
            petAge: a.petAge as string,
            petImage: (a.petImage as string) || '',
            status: a.status as 'approved' | 'reviewing' | 'rejected',
            type: 'foster' as const,
            petId: a.petId as string,
            applicantName: a.applicantName as string,
            applicantBio: a.applicantBio as string,
          }))
        : [];

      setApplications([...myApps, ...receivedApps]);
    } catch (err) {
      console.error('Failed to refresh applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  const addApplication = async (app: Parameters<ApplicationContextType['addApplication']>[0]) => {
    if (!isAuthenticated) {
      throw new Error('请先登录');
    }

    const res = await applicationsApi.submit({
      pet_id: app.petId,
      type: app.type,
      applicant_name: app.applicantName || '未知',
      applicant_phone: app.applicantPhone || '',
      applicant_address: app.applicantAddress || '',
      applicant_wechat: app.applicantWechat,
      applicant_bio: app.applicantBio,
      housing_type: app.housingType || 'owned',
      housing_description: app.housingDescription,
      has_outdoor_space: app.hasOutdoorSpace ?? false,
      experience_level: app.experienceLevel || 'some',
    });

    if (!res.success) throw new Error(res.error || '提交申请失败');

    // Optimistically add to local state
    const newApp: Application = {
      id: res.data.id,
      petName: app.petName,
      petBreed: app.petBreed,
      petAge: app.petAge,
      petImage: app.petImage,
      status: 'reviewing',
      type: app.type,
      petId: app.petId,
      applicantName: app.applicantName,
      applicantBio: app.applicantBio,
    };
    setApplications(prev => [newApp, ...prev]);
  };

  const updateApplicationStatus = async (id: string, status: 'approved' | 'rejected' | 'reviewing') => {
    if (status === 'reviewing') return; // not supported via API

    // Optimistic update
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));

    try {
      const res = await applicationsApi.updateStatus(id, status as 'approved' | 'rejected');
      if (!res.success) throw new Error(res.error);
    } catch (err) {
      // Rollback
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'reviewing' } : a));
      throw err;
    }
  };

  return (
    <ApplicationContext.Provider value={{
      applications,
      isLoading,
      addApplication,
      updateApplicationStatus,
      refreshApplications,
    }}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationContext);
  if (!context) throw new Error('useApplications must be used within an ApplicationProvider');
  return context;
}
