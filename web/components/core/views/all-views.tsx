import React, { useCallback } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-beautiful-dnd
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// services
import stateService from "services/state.service";
// hooks
import useUser from "hooks/use-user";
import { useProjectMyMembership } from "contexts/project-member.context";
// components
import {
  AllLists,
  AllBoards,
  CalendarView,
  SpreadsheetView,
  GanttChartView,
} from "components/core";
// ui
import { EmptyState, Spinner } from "components/ui";
// icons
import { TrashIcon } from "@heroicons/react/24/outline";
// images
import emptyIssue from "public/empty-state/issue.svg";
import emptyIssueArchive from "public/empty-state/issue-archive.svg";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { IIssue, IIssueViewProps } from "types";
// fetch-keys
import { STATES_LIST } from "constants/fetch-keys";

type Props = {
  addIssueToDate: (date: string) => void;
  addIssueToGroup: (groupTitle: string) => void;
  disableUserActions: boolean;
  dragDisabled?: boolean;
  emptyState: {
    title: string;
    description?: string;
    primaryButton?: {
      icon: any;
      text: string;
      onClick: () => void;
    };
    secondaryButton?: React.ReactNode;
  };
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  handleOnDragEnd: (result: DropResult) => Promise<void>;
  openIssuesListModal: (() => void) | null;
  removeIssue: ((bridgeId: string, issueId: string) => void) | null;
  disableAddIssueOption?: boolean;
  trashBox: boolean;
  setTrashBox: React.Dispatch<React.SetStateAction<boolean>>;
  viewProps: IIssueViewProps;
};

export const AllViews: React.FC<Props> = ({
  addIssueToDate,
  addIssueToGroup,
  disableUserActions,
  dragDisabled = false,
  emptyState,
  handleIssueAction,
  handleOnDragEnd,
  openIssuesListModal,
  removeIssue,
  disableAddIssueOption = false,
  trashBox,
  setTrashBox,
  viewProps,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { user } = useUser();
  const { memberRole } = useProjectMyMembership();

  const { groupedIssues, isEmpty, issueView } = viewProps;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups);

  const handleTrashBox = useCallback(
    (isDragging: boolean) => {
      if (isDragging && !trashBox) setTrashBox(true);
    },
    [trashBox, setTrashBox]
  );

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <StrictModeDroppable droppableId="trashBox">
        {(provided, snapshot) => (
          <div
            className={`${
              trashBox ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            } fixed top-4 left-1/2 -translate-x-1/2 z-40 w-72 flex items-center justify-center gap-2 rounded border-2 border-red-500/20 bg-custom-background-100 px-3 py-5 text-xs font-medium italic text-red-500 ${
              snapshot.isDraggingOver ? "bg-red-500 blur-2xl opacity-70" : ""
            } transition duration-300`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <TrashIcon className="h-4 w-4" />
            Drop here to delete the issue.
          </div>
        )}
      </StrictModeDroppable>
      {groupedIssues ? (
        !isEmpty ||
        issueView === "kanban" ||
        issueView === "calendar" ||
        issueView === "gantt_chart" ? (
          <>
            {issueView === "list" ? (
              <AllLists
                states={states}
                addIssueToGroup={addIssueToGroup}
                handleIssueAction={handleIssueAction}
                openIssuesListModal={cycleId || moduleId ? openIssuesListModal : null}
                removeIssue={removeIssue}
                disableUserActions={disableUserActions}
                disableAddIssueOption={disableAddIssueOption}
                user={user}
                userAuth={memberRole}
                viewProps={viewProps}
              />
            ) : issueView === "kanban" ? (
              <AllBoards
                addIssueToGroup={addIssueToGroup}
                disableUserActions={disableUserActions}
                disableAddIssueOption={disableAddIssueOption}
                dragDisabled={dragDisabled}
                handleIssueAction={handleIssueAction}
                handleTrashBox={handleTrashBox}
                openIssuesListModal={cycleId || moduleId ? openIssuesListModal : null}
                removeIssue={removeIssue}
                states={states}
                user={user}
                userAuth={memberRole}
                viewProps={viewProps}
              />
            ) : issueView === "calendar" ? (
              <CalendarView
                handleIssueAction={handleIssueAction}
                addIssueToDate={addIssueToDate}
                disableUserActions={disableUserActions}
                user={user}
                userAuth={memberRole}
              />
            ) : issueView === "spreadsheet" ? (
              <SpreadsheetView
                handleIssueAction={handleIssueAction}
                openIssuesListModal={cycleId || moduleId ? openIssuesListModal : null}
                disableUserActions={disableUserActions}
                user={user}
                userAuth={memberRole}
              />
            ) : (
              issueView === "gantt_chart" && <GanttChartView />
            )}
          </>
        ) : router.pathname.includes("archived-issues") ? (
          <EmptyState
            title="Archived Issues will be shown here"
            description="All the issues that have been in the completed or canceled groups for the configured period of time can be viewed here."
            image={emptyIssueArchive}
            primaryButton={{
              text: "Go to Automation Settings",
              onClick: () => {
                router.push(`/${workspaceSlug}/projects/${projectId}/settings/automations`);
              },
            }}
          />
        ) : (
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
            image={emptyIssue}
            primaryButton={
              emptyState.primaryButton
                ? {
                    icon: emptyState.primaryButton.icon,
                    text: emptyState.primaryButton.text,
                    onClick: emptyState.primaryButton.onClick,
                  }
                : undefined
            }
            secondaryButton={emptyState.secondaryButton}
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      )}
    </DragDropContext>
  );
};
