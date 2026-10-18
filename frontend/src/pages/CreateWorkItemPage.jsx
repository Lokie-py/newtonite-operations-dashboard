import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workItemsService } from '../api';
import { WorkItemForm } from '../components/workItems/WorkItemForm';
import { useToast } from '../context/ToastContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export function CreateWorkItemPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const created = await workItemsService.createWorkItem(formData);
      toast.success(`Work item ${created.id} created successfully.`);
      navigate(`/work-items/${created.id}`);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create work item');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Work Item</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log an incident, task, customer issue, bug, payment investigation, or approval request.
          </p>
        </div>

        <Button
          variant="outline"
          size="xs"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>

      <WorkItemForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}
