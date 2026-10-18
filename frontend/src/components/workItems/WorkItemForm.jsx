import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  WORK_ITEM_STATUS,
  WORK_ITEM_PRIORITY,
  WORK_ITEM_TYPE,
  USER_ROLE,
} from "../../utils/constants";
import { teamsService } from "../../api/services/teams.service";
import { Input } from "../common/Input";
import { Select } from "../common/Select";
import { Textarea } from "../common/Textarea";
import { Checkbox } from "../common/Checkbox";
import { Button } from "../common/Button";
import { validateWorkItemForm } from "../../utils/validators";
import { Save, ArrowLeft, AlertTriangle } from "lucide-react";

export function WorkItemForm({
  initialValues = {},
  onSubmit,
  isEdit = false,
  isLoading = false,
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: initialValues.title || "",
    description: initialValues.description || "",
    type: initialValues.type || WORK_ITEM_TYPE.TASK,
    teamId: initialValues.teamId ?? "",
    assigneeId: initialValues.assigneeId ?? "",
    priority: initialValues.priority || WORK_ITEM_PRIORITY.MEDIUM,
    status: initialValues.status || WORK_ITEM_STATUS.OPEN,
    dueDate: initialValues.dueDate
      ? initialValues.dueDate.substring(0, 10)
      : "",
    requiresApproval: !!initialValues.requiresApproval,
    requiredApproverRole:
      initialValues.requiredApproverRole || USER_ROLE.MANAGER,
    version: initialValues.version,
  });

  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      setIsLoadingTeams(true);
      setLoadError("");

      try {
        const response = await teamsService.getTeams();
        const result = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : [];

        if (!active) return;

        setTeams(result);

        const existingTeamId = initialValues.teamId ?? initialValues.team_id;

        const selectedTeam = result.find(
          (team) => Number(team.id) === Number(existingTeamId),
        );

        const nextTeamId = selectedTeam
          ? selectedTeam.id
          : result.length === 1
            ? result[0].id
            : "";

        setFormData((previous) => ({
          ...previous,
          teamId: previous.teamId || nextTeamId,
        }));
      } catch (error) {
        if (active) {
          setLoadError(
            error.userMessage || "Unable to load teams from the backend.",
          );
        }
      } finally {
        if (active) setIsLoadingTeams(false);
      }
    }

    loadTeams();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMembers() {
      if (!formData.teamId) {
        setTeamMembers([]);
        setFormData((previous) => ({ ...previous, assigneeId: "" }));
        return;
      }

      setIsLoadingMembers(true);

      try {
        const response = await teamsService.getTeamMembers(formData.teamId);
        const result = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : [];

        if (!active) return;

        setTeamMembers(result);

        setFormData((previous) => {
          const currentAssigneeExists = result.some(
            (member) => Number(member.id) === Number(previous.assigneeId),
          );

          return {
            ...previous,
            assigneeId: currentAssigneeExists ? previous.assigneeId : "",
          };
        });
      } catch (error) {
        if (active) {
          setTeamMembers([]);
          setLoadError(
            error.userMessage ||
              "Unable to load members for the selected team.",
          );
        }
      } finally {
        if (active) setIsLoadingMembers(false);
      }
    }

    loadMembers();

    return () => {
      active = false;
    };
  }, [formData.teamId]);

  // Sync the form when editing a different work item.
  useEffect(() => {
    if (!initialValues.id) return;

    setFormData({
      title: initialValues.title || "",
      description: initialValues.description || "",
      type: initialValues.type || WORK_ITEM_TYPE.TASK,
      teamId: initialValues.teamId ?? initialValues.team_id ?? "",
      assigneeId:
        initialValues.assigneeId ?? initialValues.assigned_to_id ?? "",
      priority: initialValues.priority || WORK_ITEM_PRIORITY.MEDIUM,
      status: initialValues.status || WORK_ITEM_STATUS.OPEN,
      dueDate: initialValues.dueDate
        ? initialValues.dueDate.substring(0, 10)
        : "",
      requiresApproval: !!initialValues.requiresApproval,
      requiredApproverRole:
        initialValues.requiredApproverRole || USER_ROLE.MANAGER,
      version: initialValues.version,
    });

    setIsDirty(false);
  }, [initialValues]);

  const handleChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setIsDirty(true);

    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validateWorkItemForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (!formData.teamId) {
      setErrors((previous) => ({
        ...previous,
        teamId: "Please select a team.",
      }));
      return;
    }

    if (
      formData.assigneeId &&
      !teamMembers.some(
        (member) => Number(member.id) === Number(formData.assigneeId),
      )
    ) {
      setErrors((previous) => ({
        ...previous,
        assigneeId: "Select a member of the chosen team.",
      }));
      return;
    }

    try {
      await onSubmit({
        ...formData,
        teamId: Number(formData.teamId),
        assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null,
      });

      setIsDirty(false);
    } catch (error) {
      if (
        error.validationErrors &&
        Object.keys(error.validationErrors).length > 0
      ) {
        setErrors(error.validationErrors);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg border border-slate-200 shadow-subtle"
    >
      {isDirty && (
        <div className="flex items-center gap-2 p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>You have unsaved changes in this form.</span>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm"
        >
          {loadError}
        </div>
      )}

      <Input
        label="Work Item Title"
        name="title"
        placeholder="e.g. Critical Postgres connection pool exhaustion during batch settlement"
        value={formData.title}
        onChange={(event) => handleChange("title", event.target.value)}
        error={errors.title}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Work Item Type"
          name="type"
          value={formData.type}
          onChange={(event) => handleChange("type", event.target.value)}
          options={Object.values(WORK_ITEM_TYPE)}
          error={errors.type}
          required
        />

        <Select
          label="Priority Level"
          name="priority"
          value={formData.priority}
          onChange={(event) => handleChange("priority", event.target.value)}
          options={Object.values(WORK_ITEM_PRIORITY)}
          error={errors.priority}
          required
        />

        {isEdit ? (
          <Select
            label="Current Status"
            name="status"
            value={formData.status}
            onChange={(event) => handleChange("status", event.target.value)}
            options={Object.values(WORK_ITEM_STATUS)}
            error={errors.status}
            helperText="State transitions are also auditable from the details page."
          />
        ) : (
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Status
            </label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
              Open (Default for new items)
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Assigned Team"
          name="teamId"
          value={formData.teamId}
          onChange={(event) => {
            const newTeamId = event.target.value;
            handleChange("teamId", newTeamId);
            handleChange("assigneeId", "");
          }}
          options={teams.map((team) => ({
            value: team.id,
            label: team.name,
          }))}
          error={errors.teamId}
          required
          disabled={isLoadingTeams || teams.length === 0}
        />

        <Select
          label="Assignee"
          name="assigneeId"
          value={formData.assigneeId}
          onChange={(event) => handleChange("assigneeId", event.target.value)}
          options={teamMembers.map((member) => ({
            value: member.id,
            label: `${member.full_name || member.name || member.email}`,
          }))}
          error={errors.assigneeId}
          disabled={
            !formData.teamId || isLoadingMembers || teamMembers.length === 0
          }
        />

        <Input
          label="Target Due Date"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(event) => handleChange("dueDate", event.target.value)}
          error={errors.dueDate}
        />
      </div>

      <Textarea
        label="Operational Description & Technical Context"
        name="description"
        placeholder="Provide background, error codes, impact assessment, and remediation steps..."
        rows={5}
        value={formData.description}
        onChange={(event) => handleChange("description", event.target.value)}
        error={errors.description}
        helperText="Be detailed and specific. This information is vital for on-call triage."
        required
      />

      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
        <Checkbox
          label="Require Formal Operational Approval"
          id="requiresApproval"
          checked={formData.requiresApproval}
          onChange={(event) =>
            handleChange("requiresApproval", event.target.checked)
          }
          helperText="Mandates signoff from an authorized Manager or Admin before execution/resolution."
        />

        {formData.requiresApproval && (
          <div className="pt-2 pl-6 max-w-xs">
            <Select
              label="Minimum Required Role"
              name="requiredApproverRole"
              value={formData.requiredApproverRole}
              onChange={(event) =>
                handleChange("requiredApproverRole", event.target.value)
              }
              options={[USER_ROLE.MANAGER, USER_ROLE.ADMIN]}
              error={errors.requiredApproverRole}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon={Save}
          isLoading={isLoading}
          disabled={isLoading || isLoadingTeams}
        >
          {isEdit ? "Save Changes" : "Create Work Item"}
        </Button>
      </div>
    </form>
  );
}
