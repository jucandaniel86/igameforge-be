import { useAPIFetch } from "../../composables/useApiFetch";

export const useSelector = () => {
  const games = ref<any[]>([]);
  const operators = ref<any[]>([]);

  const getGames = async () => {
    const { data, success } = await useAPIFetch("/selector/games");
    if (success) {
      games.value = data.data;
    }
  };

  const getOperators = async () => {
    const { data, success } = await useAPIFetch("/operators/selector");
    if (success) {
      operators.value = data.data;
    }
  };

  const getEnvironments = async () => {
    return await useAPIFetch("/selector/environments");
  };

  return {
    games,
    operators,
    getGames,
    getOperators,
    getEnvironments,
  };
};
