import { useState, useCallback, useEffect } from 'react';
import { ConversionJob, AppSettings } from '../types';
import { convertPdfToMarkdown } from '../utils/api';
import { persistQueue, loadPersistedQueue, clearPersistedQueue, isJobRecoverable } from '../utils/storage';

export function useConversionQueue() {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRecoverableJobs, setHasRecoverableJobs] = useState(false);

  // 页面加载时检查是否有可恢复的任务
  useEffect(() => {
    const persistedJobs = loadPersistedQueue();
    const recoverableJobs = persistedJobs.filter(isJobRecoverable);
    
    if (recoverableJobs.length > 0) {
      setHasRecoverableJobs(true);
    }
  }, []);

  // 自动持久化队列状态
  useEffect(() => {
    if (jobs.length > 0) {
      persistQueue(jobs);
    } else {
      clearPersistedQueue();
    }
  }, [jobs]);

  const addJobs = useCallback((newJobs: ConversionJob[]) => {
    const jobsWithTimestamp = newJobs.map(job => ({
      ...job,
      lastUpdated: new Date()
    }));
    setJobs(prev => [...prev, ...jobsWithTimestamp]);
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const updateJob = useCallback((jobId: string, updates: Partial<ConversionJob>) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates, lastUpdated: new Date() } : job
    ));
  }, []);

  const processQueue = useCallback(async (settings: AppSettings) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    
    for (const job of pendingJobs) {
      const startTime = new Date();
      updateJob(job.id, { 
        status: 'processing', 
        progress: 0,
        startTime,
        endTime: undefined,
        duration: undefined
      });
      
      const result = await convertPdfToMarkdown(
        job.file,
        settings,
        (progress) => updateJob(job.id, { progress })
      );
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      if (result.success) {
        updateJob(job.id, {
          status: 'completed',
          progress: 100,
          result: result.result,
          endTime,
          duration
        });
      } else {
        updateJob(job.id, {
          status: 'error',
          progress: 0,
          error: result.error,
          endTime,
          duration
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

  // 恢复队列
  const recoverJobs = useCallback(() => {
    const persistedJobs = loadPersistedQueue();
    const recoverableJobs = persistedJobs.filter(isJobRecoverable);
    
    if (recoverableJobs.length > 0) {
      // 创建虚拟File对象用于恢复
      const recoveredJobs: ConversionJob[] = recoverableJobs.map(persistedJob => ({
        id: persistedJob.id,
        filename: persistedJob.filename,
        status: persistedJob.status === 'processing' ? 'pending' : persistedJob.status, // 将处理中的任务重置为待处理
        progress: persistedJob.status === 'processing' ? 0 : persistedJob.progress,
        result: persistedJob.result,
        error: persistedJob.error,
        createdAt: new Date(persistedJob.createdAt),
        lastUpdated: new Date(persistedJob.lastUpdated),
        file: new File([], persistedJob.filename, {
          type: persistedJob.fileType,
          lastModified: new Date(persistedJob.createdAt).getTime()
        }),
        startTime: persistedJob.startTime ? new Date(persistedJob.startTime) : undefined,
        endTime: persistedJob.endTime ? new Date(persistedJob.endTime) : undefined,
        duration: persistedJob.duration
      }));
      
      setJobs(recoveredJobs);
      setHasRecoverableJobs(false);
    }
  }, []);

  // 放弃恢复
  const discardRecovery = useCallback(() => {
    clearPersistedQueue();
    setHasRecoverableJobs(false);
  }, []);

  return {
    jobs,
    isProcessing,
    hasRecoverableJobs,
    addJobs,
    removeJob,
    updateJob,
    processQueue,
    clearCompleted,
    clearAll,
    recoverJobs,
    discardRecovery
  };
}