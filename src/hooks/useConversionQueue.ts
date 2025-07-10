import { useState, useCallback } from 'react';
import { ConversionJob, AppSettings } from '../types';
import { convertPdfToMarkdown } from '../utils/api';

export function useConversionQueue() {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addJobs = useCallback((newJobs: ConversionJob[]) => {
    setJobs(prev => [...prev, ...newJobs]);
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const updateJob = useCallback((jobId: string, updates: Partial<ConversionJob>) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ));
  }, []);

  const processQueue = useCallback(async (settings: AppSettings) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    
    for (const job of pendingJobs) {
      updateJob(job.id, { status: 'processing', progress: 0 });
      
      const result = await convertPdfToMarkdown(
        job.file,
        settings,
        (progress) => updateJob(job.id, { progress })
      );
      
      if (result.success) {
        updateJob(job.id, {
          status: 'completed',
          progress: 100,
          result: result.result
        });
      } else {
        updateJob(job.id, {
          status: 'error',
          progress: 0,
          error: result.error
        });
      }
    }
    
    setIsProcessing(false);
  }, [jobs, isProcessing, updateJob]);

  const clearCompleted = useCallback(() => {
    setJobs(prev => prev.filter(job => job.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    setJobs([]);
  }, []);

  return {
    jobs,
    isProcessing,
    addJobs,
    removeJob,
    updateJob,
    processQueue,
    clearCompleted,
    clearAll
  };
}