import type { ReportHeadersData } from "~/app/types";

export const RESOURCE_HEADERS: ReportHeadersData[] = [
  {
    title: "Game ID",
    align: "start",
    sortable: false,
    value: "gameId",
    key: "gameId",
  },
  {
    title: "Resources",
    align: "start",
    sortable: false,
    value: "resources",
    key: "resources",
  },
  {
    title: "Game Name",
    align: "start",
    sortable: false,
    key: "label",
    value: "label",
  },
  {
    title: "Has Template",
    align: "start",
    sortable: false,
    key: "has_game_resource_values",
    value: "has_game_resource_values",
  },
  {
    title: "Actions",
    align: "start",
    sortable: false,
    value: "actions",
  },
];

export const RESOURCE_OPERATOR_HEADERS: ReportHeadersData[] = [
  {
    title: "Game ID",
    align: "start",
    sortable: false,
    value: "id",
    key: "id",
  },
  {
    title: "Resources",
    align: "start",
    sortable: false,
    value: "resources",
    key: "resources",
  },
  {
    title: "Game Name",
    align: "start",
    sortable: false,
    key: "label",
    value: "label",
  },
  {
    title: "Has Template",
    align: "start",
    sortable: false,
    key: "has_game_resource_values",
    value: "has_game_resource_values",
  },
  {
    title: "Actions",
    align: "start",
    sortable: false,
    value: "actions",
  },
];
