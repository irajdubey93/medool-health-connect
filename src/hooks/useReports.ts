/**
 * Report Hooks
 * Fetch fresh download URLs (never cached)
 */

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ReportDownloadResponse } from "@/types/api";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

export function useReportDownload() {
  return useMutation({
    mutationFn: ({ orderId, reportId }: { orderId: string; reportId: string }) =>
      api.get<ReportDownloadResponse>(`/orders/${orderId}/reports/${reportId}/download`),
    onSuccess: (data, variables) => {
      // Open in new tab
      window.open(data.download_url, "_blank");
      analytics.reportDownloaded(variables.orderId, "report");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
