
import { PartnerJobData, PartnerPerformanceData } from "@/types/production";
import { formatAnalysisDate } from "@/utils/analysisUtils";

/**
 * Format efficiency percentage for display
 */
export const formatEfficiency = (efficiency: number): string => {
  return `${efficiency.toFixed(1)}%`;
};

/**
 * Calculate waste percentage
 */
export const calculateWastePercentage = (provided: number, received: number): number => {
  if (provided === 0) return 0;
  return ((provided - received) / provided) * 100;
};

/**
 * Format waste percentage for display
 */
export const formatWaste = (waste: number): string => {
  return `${waste.toFixed(1)}%`;
};

/**
 * Calculate completion time in days
 */
export const calculateCompletionDays = (createdAt: string, completedAt?: string): number | null => {
  if (!completedAt) return null;
  
  const start = new Date(createdAt);
  const end = new Date(completedAt);
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Get job type display name
 */
export const getJobTypeDisplay = (type: 'cutting' | 'printing' | 'stitching'): string => {
  const typeMap = {
    cutting: 'Cutting',
    printing: 'Printing',
    stitching: 'Stitching'
  };
  
  return typeMap[type];
};

/**
 * Format date for partner analysis display
 */
export const formatPartnerDate = (dateString: string): string => {
  return formatAnalysisDate(dateString);
};

/**
 * Sort partners by efficiency
 */
export const sortPartnersByEfficiency = (partners: PartnerPerformanceData[]): PartnerPerformanceData[] => {
  return [...partners].sort((a, b) => b.efficiency_ratio - a.efficiency_ratio);
};

/**
 * Filter partner jobs by type
 */
export const filterJobsByType = (jobs: PartnerJobData[], type?: 'cutting' | 'printing' | 'stitching'): PartnerJobData[] => {
  if (!type) return jobs;
  return jobs.filter(job => job.job_type === type);
};

/**
 * Group jobs by partner
 */
export const groupJobsByPartner = (jobs: PartnerJobData[]): Record<string, PartnerJobData[]> => {
  const grouped: Record<string, PartnerJobData[]> = {};
  
  jobs.forEach(job => {
    if (!grouped[job.partner_name]) {
      grouped[job.partner_name] = [];
    }
    grouped[job.partner_name].push(job);
  });
  
  return grouped;
};
