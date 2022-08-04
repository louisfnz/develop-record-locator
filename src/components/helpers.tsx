import React, { ReactChild } from 'react';

const utcDate = (date: Date) => {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

const daysDifference = (from: Date, to: Date) => {
  const dateFrom = utcDate(from);
  const dateTo = utcDate(to);
  return Math.floor((dateTo - dateFrom) / (1000 * 60 * 60 * 24));
};

const getCompletedDate = async (
  recordId: string,
  recordType: 'Feature' | 'Requirement'
): Promise<stringb | undefined> => {
  const fragment = new aha.Fragment().fragment(
    new aha.Fragment('recordEvents')
      .argument(
        'filters',
        {
          eventType: 'RECORD_COMPLETED',
          [`${recordType.toLowerCase()}Id`]: recordId,
        },
        'RecordEventFilters!'
      )
      .fragment(new aha.Fragment('raw').attr('id', 'createdAt'))
  );
  try {
    const result = await aha.graphQuery(fragment);
    const events = result.recordEvents?.raw;
    if (Array.isArray(events) && events.length) {
      return events[events.length - 1].createdAt;
    }
  } catch (e) {
    return;
  }
};

export const getRecord = (
  Model: Aha.FeatureConstructor | Aha.RequirementConstructor,
  id: string
): Aha.Feature | Aha.Requirement => {
  return Model.select('id', 'referenceNum')
    .merge({
      team: aha.models.Project.select(
        'id',
        'backlogManagementEnabled',
        'iterationsEnabled'
      ).merge({ currentIteration: ['id'] }),
      project: ['id'],
      iteration: ['id', 'name'],
      teamWorkflowStatus: aha.models.WorkflowStatus.select(
        'id',
        'name',
        'internalMeaning',
        'createdAt'
      ),
      bookmarksRecordPositions: ['id', 'bookmarkType'],
    })
    .find(id);
};

export const determineLocation = async (
  record: Aha.Feature | Aha.Requirement
): Promise<ReactChild> => {
  if (record.teamWorkflowStatus.isCompleted) {
    const completedDate = await getCompletedDate(record.id, record.typename);

    if (completedDate) {
      const daysSinceCompletion = daysDifference(
        new Date(completedDate),
        new Date()
      );
      if (daysSinceCompletion > 7) {
        return <span style={{ fontStyle: 'italic' }}>Record completed</span>;
      }
    }
  }

  if (!record.team?.id) {
    return <span style={{ color: 'var(--theme-accent-icon)' }}>N/A</span>;
  } else {
    let recordLocation;
    if (!record.team.backlogManagementEnabled) {
      return 'Workflow board';
    }
    if (record.team.iterationsEnabled && record.iteration?.id) {
      if (record.iteration.id === record.team.currentIteration.id)
        return `Workflow board - ${record.iteration.name}`;
    }

    if (record.team.id === record.project.id) {
      recordLocation = 'Engineering work backlog';
    }
    if (record.team.id !== record.project.id) {
      recordLocation = 'Product work backlog';
    }
    if (record.recordPosition('Bookmarks::TeamBacklog')) {
      recordLocation = 'Prioritized backlog';
    }
    if (record.recordPosition('Bookmarks::WorkflowBoard')) {
      recordLocation = 'Workflow board';
    }
    return recordLocation;
  }
};
