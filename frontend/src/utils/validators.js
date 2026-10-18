export function validateWorkItemForm(values) {
  const errors = {};

  if (!values.title || !values.title.trim()) {
    errors.title = 'Title is required';
  } else if (values.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters';
  } else if (values.title.trim().length > 150) {
    errors.title = 'Title must be 150 characters or less';
  }

  if (!values.description || !values.description.trim()) {
    errors.description = 'Description is required';
  } else if (values.description.trim().length < 10) {
    errors.description = 'Description must provide sufficient detail (at least 10 characters)';
  }

  if (!values.type) {
    errors.type = 'Work item type is required';
  }

  if (!values.teamId) {
    errors.teamId = 'Team is required';
  }

  if (!values.priority) {
    errors.priority = 'Priority is required';
  }

  if (!values.assigneeId) {
    errors.assigneeId = 'Assignee is required';
  }

  if (values.requiresApproval && !values.requiredApproverRole) {
    errors.requiredApproverRole = 'Please specify the required approver role';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginForm(email, password) {
  const errors = {};
  if (!email || !email.trim()) {
    errors.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateComment(text) {
  if (!text || !text.trim()) {
    return 'Comment cannot be empty';
  }
  if (text.trim().length > 1000) {
    return 'Comment must be under 1000 characters';
  }
  return null;
}

export function validateRejectionReason(reason) {
  if (!reason || !reason.trim()) {
    return 'A rejection reason is required for audit compliance';
  }
  if (reason.trim().length < 5) {
    return 'Rejection reason must be at least 5 characters';
  }
  return null;
}
