export const useApiGameTemplates = () => {
  const omitColumns: string[] = ["description", "thumbnail"];

  const getGameTemplatesTypes = async () => {
    const { data } = await useAPIFetch("/resources/game-resource-types/list");
    return data.data.fields.filter((col: any) => !omitColumns.includes(col.fieldKey));
  };

  const getGameTemplates = async () => {
    const { data } = await useAPIFetch("/resources/game-templates");
    return data.data;
  };

  const loadPage = async () => {
    return Promise.all([getGameTemplatesTypes(), getGameTemplates()]);
  };

  return {
    getGameTemplatesTypes,
    getGameTemplates,
    loadPage,
  };
};
