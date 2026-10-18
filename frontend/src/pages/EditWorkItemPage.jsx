import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workItemsService } from '../api';
import { WorkItemForm } from '../components/workItems/WorkItemForm';
import { ConcurrencyConflictModal } from '../components/workItems/ConcurrencyConflictModal';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export function EditWorkItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Concurrency Conflict handling
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [serverData, setServerData] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const fetchItem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workItemsService.getWorkItemById(id);
      setItem(data);
    } catch (err) {
      setError(err.userMessage || `Failed to load work item ${id}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmittedData(formData);

    try {
      // Pass the version we loaded with for optimistic concurrency check
      const updated = await workItemsService.updateWorkItem(id, formData, item.version);
      toast.success(`Work item ${updated.id} updated successfully.`);
      navigate(`/work-items/${updated.id}`);
    } catch (err) {
      if (err.isConflict) {
        setServerData(err.data?.currentItem);
        setConflictModalOpen(true);
        toast.error('Concurrency conflict: Record changed by another operator.');
      } else {
        toast.error(err.userMessage || 'Failed to update work item');
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceOverwrite = async () => {
    if (!serverData) return;
    setIsSubmitting(true);
    try {
      // Overwrite using the latest server version
      const updated = await workItemsService.updateWorkItem(id, submittedData, serverData.version);
      toast.warning(`Force overwritten work item ${updated.id} with latest version v${updated.version}`);
      setConflictModalOpen(false);
      navigate(`/work-items/${updated.id}`);
    } catch (err) {
      toast.error('Failed to overwrite record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorAlert message={error || 'Item not found'} onRetry={fetchItem} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Edit Work Item: <span className="font-mono text-brand-600">{item.id}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Concurrency Version: <span className="font-mono font-medium">v{item.version}</span> • Target SLA and operational fields.
          </p>
        </div>

        <Button
          variant="outline"
          size="xs"
          icon={ArrowLeft}
          onClick={() => navigate(`/work-items/${item.id}`)}
        >
          Cancel
        </Button>
      </div>

      <WorkItemForm
        initialValues={item}
        onSubmit={handleSubmit}
        isEdit={true}
        isLoading={isSubmitting}
      />

      <ConcurrencyConflictModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        serverData={serverData}
        clientData={submittedData}
        onRefresh={() => {
          setConflictModalOpen(false);
          fetchItem();
        }}
        onForceOverwrite={handleForceOverwrite}
        isOverwriting={isSubmitting}
      />
    </div>
  );
}
